//we don't need private member, so don't 
module.exports = function ClozeCard(text, cloze) {
  if (this instanceof ClozeCard) {
    this.fullText = text;
    this.partial = text.replace(cloze, '...');
    //Validation. However, this condition will be never met, because we validate input before creating cloze card.
    if(this.partial === text) throw new Error('This doesn\'t work, oops');
    this.cloze = cloze;

  } else return new ClozeCard(text, cloze);
}