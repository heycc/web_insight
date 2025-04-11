import os
import logging
import sys
import uuid
import contextvars
import functools
import inspect
import json

from logging.handlers import TimedRotatingFileHandler
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
# Create logs directory if it doesn't exist
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

# Context variables
trace_id_var = contextvars.ContextVar('trace_id', default=None)
request_context_var = contextvars.ContextVar('request_context', default={})

# JSON formatter for structured logging
class JsonFormatter(logging.Formatter):
    """
    Formatter that outputs JSON strings after parsing the log record.
    """
    def format(self, record):
        logobj = {}
        
        # Standard log record attributes
        logobj["timestamp"] = self.formatTime(record, self.datefmt)
        logobj["level"] = record.levelname
        logobj["logger"] = record.name
        logobj["message"] = record.getMessage()
        
        # Add trace_id and component
        logobj["trace_id"] = getattr(record, "trace_id", "-")
        logobj["component"] = getattr(record, "component", "app")
        
        # Include all other record attributes
        for key, value in record.__dict__.items():
            if key not in ["timestamp", "level", "logger", "message", "trace_id", "component", 
                          "args", "exc_info", "exc_text", "levelname", "levelno", 
                          "created", "msecs", "relativeCreated", "funcName", "lineno", 
                          "module", "pathname", "filename", "processName", "process", 
                          "threadName", "thread", "msg", "name", "asctime"]:
                logobj[key] = value
                
        # Add exception info if available
        if record.exc_info:
            logobj["exception"] = self.formatException(record.exc_info)
            
        return json.dumps(logobj)

# Configure basic logger
def setup_logger(name="plify_proxy", log_level=logging.INFO, enable_console=None, json_format=None):
    """
    Set up a logger with weekly rotation
    
    Args:
        name: Logger name
        log_level: Logging level
        enable_console: Enable console output (defaults to True in development mode)
        json_format: Use JSON format for logs (defaults to False in development mode)
        
    Returns:
        Configured logger instance
    """
    # Default settings based on environment
    env = os.getenv("ENVIRONMENT", "development")
    if enable_console is None:
        enable_console = env == "development" 
    if json_format is None:
        json_format = env != "development"
    
    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(log_level)
    
    # Clear existing handlers to avoid duplicate logs
    if logger.handlers:
        logger.handlers.clear()
    
    # Create formatters
    if json_format:
        file_formatter = JsonFormatter()
    else:
        file_formatter = logging.Formatter(
            "%(asctime)s | %(levelname)s | %(name)s | [%(trace_id)s] | %(component)s | %(message)s"
        )
    
    # Console formatter is always human-readable
    console_formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | [%(trace_id)s] | %(component)s | %(message)s"
    )
    
    # File handler with weekly rotation
    file_handler = TimedRotatingFileHandler(
        filename=log_dir / f"{name}.log",
        when="W0",  # Weekly rotation on Monday
        interval=1,
        backupCount=4,  # Keep 4 weeks of logs
        encoding="utf-8"
    )
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)
    
    # Add console handler if enabled
    if enable_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)
    
    return logger

# Create default application logger
app_logger = setup_logger()

# Trace ID management
def get_trace_id():
    """Get the current trace ID or None if not set"""
    return trace_id_var.get()

def set_trace_id(trace_id=None):
    """Set a trace ID for the current context"""
    if trace_id is None:
        trace_id = str(uuid.uuid4())
    trace_id_var.set(trace_id)
    return trace_id

# Request context management
def get_request_context():
    """Get the current request context"""
    return request_context_var.get()

def set_request_context(uri=None, **kwargs):
    """Set request context information"""
    context = get_request_context().copy()
    if uri:
        context['uri'] = uri
    for key, value in kwargs.items():
        context[key] = value
    request_context_var.set(context)
    return context

def with_trace_id(func):
    """Decorator to ensure a trace ID is set for the function execution"""
    @functools.wraps(func)
    async def async_wrapper(*args, **kwargs):
        if get_trace_id() is None:
            set_trace_id()
        return await func(*args, **kwargs)
    
    @functools.wraps(func)
    def sync_wrapper(*args, **kwargs):
        if get_trace_id() is None:
            set_trace_id()
        return func(*args, **kwargs)
    
    # Use the appropriate wrapper based on whether the decorated function is async
    if inspect.iscoroutinefunction(func):
        return async_wrapper
    return sync_wrapper

# Custom filter to add context information to log records
class LogContextFilter(logging.Filter):
    def filter(self, record):
        # Add trace ID
        trace_id = get_trace_id()
        record.trace_id = trace_id if trace_id else "-"
        
        # Add request context info
        context = get_request_context()
        record.uri = context.get('uri', '-')
        
        # Add component name (formerly module)
        record.component = context.get('component', context.get('module', 'app'))
        
        # Add all other context values as record attributes
        for key, value in context.items():
            if key not in ('uri', 'module', 'component'):  # Already handled
                setattr(record, key, value)
                
        return True

# Add context filter to all handlers
for handler in app_logger.handlers:
    if hasattr(handler, 'filters'):
        handler.addFilter(LogContextFilter())

# Helper function to prepare logging context
def _prepare_log_context(kwargs):
    """
    Extract component name and prepare context for logging
    
    Args:
        kwargs: Keyword arguments passed to the logging function
        
    Returns:
        tuple: (remaining kwargs, component name)
    """
    # Extract component from kwargs or caller frame
    component = kwargs.pop('component', None)
    if component is None:
        # Try to get the caller's module name (2 levels up to skip this helper function)
        frame = inspect.currentframe().f_back.f_back
        module_name = frame.f_globals['__name__'].split('.')[-1] if frame else 'unknown'
        component = module_name
    
    # Extract and set context
    context = kwargs.pop('context', {})
    context['component'] = component
    set_request_context(**context)
    
    return kwargs, component

# Log levels convenience functions
def debug(msg, *args, **kwargs):
    kwargs, _ = _prepare_log_context(kwargs)
    app_logger.debug(msg, *args, **kwargs)

def info(msg, *args, **kwargs):
    kwargs, _ = _prepare_log_context(kwargs)
    app_logger.info(msg, *args, **kwargs)

def warning(msg, *args, **kwargs):
    kwargs, _ = _prepare_log_context(kwargs)
    app_logger.warning(msg, *args, **kwargs)

def error(msg, *args, **kwargs):
    kwargs, _ = _prepare_log_context(kwargs)
    app_logger.error(msg, *args, **kwargs)

def critical(msg, *args, **kwargs):
    kwargs, _ = _prepare_log_context(kwargs)
    app_logger.critical(msg, *args, **kwargs) 