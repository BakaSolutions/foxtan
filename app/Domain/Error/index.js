class CustomError extends Error {

  /**
   * Is used for displaying custom errors in API endpoints.
   * @param message {String} SOME_CAPS_STRING
   * @param description {String} Human-readable error message
   * @param code {Number}
   */
  constructor(message, description, code) {
    super(description);
    this.description = this.message;

    this.message = message;
    this.code = code;
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
    out.stack = this.stack;
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

class BoardNotFoundError extends CustomError {
  constructor(message) {
    super("BOARD_NOT_FOUND", message || "There is no such a board", 404);
  }
}

class ThreadNotFoundError extends CustomError {
  constructor(message) {
    super("THREAD_NOT_FOUND", message || "There is no such a thread", 404);
  }
}

class ThreadsNotFoundError extends CustomError {
  constructor(message) {
    super("THREADS_NOT_FOUND", message || "There is no threads on such page of a board", 404);
  }
}

class PostNotFoundError extends CustomError {
  constructor(message) {
    super("POST_NOT_FOUND", message || "There is no such a post", 404);
  }
}

/*class PostDeletedError extends CustomError {
  constructor(message) {
    super("POST_DELETED", message || "Post was deleted", 410);
  }
}*/

class DtoError extends CustomError {
  constructor(description) {
    super("DTO_ERROR", description);
  }
}


class BadRequestError extends ValidationError {
  constructor(description) {
    super("BAD_REQUEST", description || "Bad request");
  }
}


module.exports = {
  CustomError,
  ValidationError,

  MissingParamError,

  BoardNotFoundError,

  ThreadNotFoundError,
  ThreadsNotFoundError,

  PostNotFoundError,
  DtoError,
  BadRequestError
};
