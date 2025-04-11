import os
import logging
from logging.handlers import TimedRotatingFileHandler
import sys
from pathlib import Path
import uuid
import contextvars
import functools
import inspect

# Create logs directory if it doesn't exist
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

# Context variables
trace_id_var = contextvars.ContextVar('trace_id', default=None)
request_context_var = contextvars.ContextVar('request_context', default={})

# Configure basic logger
def setup_logger(name="plify_proxy", log_level=logging.INFO):
    """
    Set up a logger with weekly rotation
    
    Args:
        name: Logger name
        log_level: Logging level
        
    Returns:
        Configured logger instance
    """
    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(log_level)
    
    # Clear existing handlers to avoid duplicate logs
    if logger.handlers:
        logger.handlers.clear()
    
    # Configure log format with trace ID and component
    log_format = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | [%(trace_id)s] | %(component)s | %(message)s"
    )
    
    # File handler with weekly rotation
    file_handler = TimedRotatingFileHandler(
        filename=log_dir / f"{name}.log",
        when="W0",  # Weekly rotation on Monday
        interval=1,
        backupCount=4,  # Keep 4 weeks of logs
        encoding="utf-8"
    )
    file_handler.setFormatter(log_format)
    logger.addHandler(file_handler)
    
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

# Log levels convenience functions
def debug(msg, *args, **kwargs):
    # Extract component from kwargs or caller frame
    component = kwargs.pop('component', None)
    if component is None:
        # Try to get the caller's module name
        frame = inspect.currentframe().f_back
        module_name = frame.f_globals['__name__'].split('.')[-1] if frame else 'unknown'
        component = module_name
    
    # Extract and set context
    context = kwargs.pop('context', {})
    context['component'] = component
    set_request_context(**context)
    
    app_logger.debug(msg, *args, **kwargs)

def info(msg, *args, **kwargs):
    # Extract component from kwargs or caller frame
    component = kwargs.pop('component', None)
    if component is None:
        # Try to get the caller's module name
        frame = inspect.currentframe().f_back
        module_name = frame.f_globals['__name__'].split('.')[-1] if frame else 'unknown'
        component = module_name
    
    # Extract and set context
    context = kwargs.pop('context', {})
    context['component'] = component
    set_request_context(**context)
    
    app_logger.info(msg, *args, **kwargs)

def warning(msg, *args, **kwargs):
    # Extract component from kwargs or caller frame
    component = kwargs.pop('component', None)
    if component is None:
        # Try to get the caller's module name
        frame = inspect.currentframe().f_back
        module_name = frame.f_globals['__name__'].split('.')[-1] if frame else 'unknown'
        component = module_name
    
    # Extract and set context
    context = kwargs.pop('context', {})
    context['component'] = component
    set_request_context(**context)
    
    app_logger.warning(msg, *args, **kwargs)

def error(msg, *args, **kwargs):
    # Extract component from kwargs or caller frame
    component = kwargs.pop('component', None)
    if component is None:
        # Try to get the caller's module name
        frame = inspect.currentframe().f_back
        module_name = frame.f_globals['__name__'].split('.')[-1] if frame else 'unknown'
        component = module_name
    
    # Extract and set context
    context = kwargs.pop('context', {})
    context['component'] = component
    set_request_context(**context)
    
    app_logger.error(msg, *args, **kwargs)

def critical(msg, *args, **kwargs):
    # Extract component from kwargs or caller frame
    component = kwargs.pop('component', None)
    if component is None:
        # Try to get the caller's module name
        frame = inspect.currentframe().f_back
        module_name = frame.f_globals['__name__'].split('.')[-1] if frame else 'unknown'
        component = module_name
    
    # Extract and set context
    context = kwargs.pop('context', {})
    context['component'] = component
    set_request_context(**context)
    
    app_logger.critical(msg, *args, **kwargs) 