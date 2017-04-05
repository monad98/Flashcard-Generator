const convertToBasicCardChoices = basicCard => {
  return {
    name: "Basic Card: " + basicCard.front,
    value: basicCard
  };
};
const convertToClozeCardChoices = clozeCard => {
  return {
    name: "Cloze Card: " + clozeCard.partial,
    value: clozeCard
  };
};

const makeCardChoiceQuestion = cardChoices => ({
  type: 'list',
  name: 'selectCard',
  message: 'Choose a card to solve.',
  choices: cardChoices
});

module.exports = {
  convertToBasicCardChoices,
  convertToClozeCardChoices,
  makeCardChoiceQuestion
};

