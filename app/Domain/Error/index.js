const Tools = require('../../Infrastructure/Tools.js');

class CustomError extends Error {

  /**
   * Is used for displaying custom errors in API endpoints.
   * @param {String} message SOME_CAPS_STRING
   * @param {String} description Human-readable error message
   * @param {Number} code
   * @param {String} [stack]
   */
  constructor(message, description, code, stack) {
    super(description);
    this.description = this.message;

    this.message = message;
    this.code = code;
    this.stack = stack;
  }

  display() {
    return {
      message: this.message,
      description: this.description,
      code: this.code
    };
  }

  displayWithStack() {
    let out = this.display();
    out.stack = this.stack?.replaceAll(Tools.ROOT, '');
    return out;
  }

}

class ValidationError extends CustomError {
  constructor(message, description, code) {
    super(message, description, code || 400);
  }
}

class MissingParamError extends ValidationError {
  constructor(description) {
    super("MISSING_PARAM", description);
  }
}

class BadRequestError extends ValidationError {
  constructor(description) {
    super("BAD_REQUEST", description || "Bad request");
  }
}

class NotAuthorizedError extends CustomError {
  constructor(description) {
    super("NOT_AUTHORIZED", description || "For this request you need to log in", 401);
  }
}

class ForbiddenError extends CustomError {
  constructor(description) {
    super("FORBIDDEN", description || "You're not allowed to do this", 403);
  }
}

class NotFoundError extends CustomError {
  constructor(code, description) {
    super(code || "NOT_FOUND", description || "Not found", 404);
  }
}

class BoardNotFoundError extends NotFoundError {
  constructor(description) {
    super("BOARD_NOT_FOUND", description || "There is no such a board");
  }
}

class ThreadNotFoundError extends NotFoundError {
  constructor(description) {
    super("THREAD_NOT_FOUND", description || "There is no such a thread");
  }
}

class ThreadsNotFoundError extends NotFoundError {
  constructor(description) {
    super("THREADS_NOT_FOUND", description || "There is no threads on such page of a board");
  }
}

class PostNotFoundError extends NotFoundError {
  constructor(description) {
    super("POST_NOT_FOUND", description || "There is no such a post");
  }
}

class PostsNotFoundError extends NotFoundError {
  constructor(description) {
    super("POSTS_NOT_FOUND", description || "There is no such posts");
  }
}

class ConflictError extends CustomError {
  constructor(description) {
    super("CONFLICT", description || "Conflict error", 409);
  }
}

/*class PostDeletedError extends CustomError {
  constructor(description) {
    super("POST_DELETED", description || "Post was deleted", 410);
  }
}*/

class DtoError extends CustomError {
  constructor(description) {
    super("DTO_ERROR", description);
  }
}


module.exports = {
  CustomError,

  // 400
  ValidationError,
  MissingParamError,
  BadRequestError,
  // 401
  NotAuthorizedError,
  // 403
  ForbiddenError,
  // 404
  NotFoundError,
  BoardNotFoundError,
  ThreadNotFoundError,
  ThreadsNotFoundError,
  PostNotFoundError,
  PostsNotFoundError,
  // 409
  ConflictError,
  // 410
  // PostDeletedError,

  DtoError,
};
