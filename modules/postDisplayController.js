export class PostDisplayController {
  static SELECTORS = {
    postTitle: '#post-title',
    postContent: '#post-content',
    postAuthor: '#post-author',
    postScore: '#post-score',
    commentsList: '#comments-list',
    postUrl: '#post-url'
  };

  static updatePostDisplay(postData) {
    document.querySelector(PostDisplayController.SELECTORS.postTitle).textContent = postData.title || 'Untitled Post';
    document.querySelector(PostDisplayController.SELECTORS.postContent).textContent = postData.content || 'No content';
    document.querySelector(PostDisplayController.SELECTORS.postAuthor).textContent = `by ${postData.author || 'Unknown'}`;
    document.querySelector(PostDisplayController.SELECTORS.postScore).textContent = `${postData.score || 0} points`;
    document.querySelector(PostDisplayController.SELECTORS.postUrl).href = postData.url || '';
    document.querySelector(PostDisplayController.SELECTORS.postUrl).textContent = postData.url || '';
  }

  static updateComments(comments) {
    const commentsList = document.querySelector(PostDisplayController.SELECTORS.commentsList);
    commentsList.innerHTML = '';
    
    comments.forEach(comment => {
      const commentDiv = document.createElement('div');
      commentDiv.className = 'comment';
      commentDiv.innerHTML = `
        <div class="author">${comment.author || 'Deleted'}</div>
        <div class="content">${(comment.content || '').replace(/\n/g, '<br>')}</div>
        <div class="score">${comment.score || 0} points</div>
      `;
      commentsList.appendChild(commentDiv);
    });
  }

  static showError(message) {
    document.querySelector(PostDisplayController.SELECTORS.postTitle).textContent = 'Error';
    document.querySelector(PostDisplayController.SELECTORS.postContent).textContent = message;
    document.querySelector(PostDisplayController.SELECTORS.postAuthor).textContent = '';
    document.querySelector(PostDisplayController.SELECTORS.postScore).textContent = '';
    document.querySelector(PostDisplayController.SELECTORS.commentsList).innerHTML = '';
  }
}