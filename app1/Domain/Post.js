class Post {

  _id;
  _number;
  _subject;
  _text;
  _attachments = [];

  /**
   *
   * @param {String} subject
   * @param {String} text
   */
  constructor(subject, text) {
    this._subject = subject;
    this._text = text;
  }

  get id() {
    return this._id;
  }

  /**
   *
   * @param {Attachment[]} attachments
   */
  addAttachments(attachments) {
    this._attachments.push(attachments);
  }

  /**
   *
   * @param {Number} number
   */
  setNumber(number) {
    this._number = number;
  }

}

module.exports = Post;
