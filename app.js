const Rx = require('rx'); // inquirer support only rxjs 4.x
const inquirer = require('inquirer');
const BasicCard = require('./basic-card');
const ClozeCard = require('./cloze-card');
const question = require('./questions');
const helper = require('./helper');

// question stream
const questions$ = new Rx.BehaviorSubject(question.whatDoYouWant);

// user answer stream
const answers$ = inquirer.prompt(questions$).ui.process;
const basicFrontText$ = new Rx.Subject();
const basicBackText$ = new Rx.Subject();
const clozeFullText$ = new Rx.Subject();
const clozeClozeText$ = new Rx.Subject();
const selectedCard$ = new Rx.Subject();
const answerForCardProblem$ = new Rx.Subject();
const displayCards$ = new Rx.Subject();

//subscribe answer
answers$.subscribe(ans => {
  switch (ans.name) {
    case 'action': {
      if (ans.answer === 'create') return questions$.onNext(question.createWhichCard); //ask which card do you want to create
      
      // user selected display
      // we convert both cards streams to observable<Array<question>> and then push this to the question stream
      else return displayCards$.onNext("WOW!");
    }

    //answer for 'select card to answer'
    case 'selectCard': {
      const card = ans.answer;
      selectedCard$.onNext(card); //push card to selectedCard stream;
      if(card instanceof BasicCard) {
        return questions$.onNext(Object.assign(question.cardQuestion, {message: card.front}));
      } else {//user selected ClozeCard
        return questions$.onNext(Object.assign(question.cardQuestion, {message: card.partial}));
      }
    }

    //answer for a basic/cloze card front/partial text(eg. "who is the first president of USA?" or " ... is the first president of USA.")
    case 'answerForCard': {
      answerForCardProblem$.onNext(ans.answer); //wait until answer check
    }

    //answer for a "which card do you want to create?"
    case 'createWhichCard': {
      if (ans.answer === 'basic') { //if basic card, ask front text
        return questions$.onNext(question.basicFront);
      }
      else return questions$.onNext(question.clozeFullText); //if cloze card, ask full text
    }

    //answer for a "What is a 'front' text of Basic card?"
    case 'front': {
      basicFrontText$.onNext(ans.answer); // push front text to stream
      return questions$.onNext(question.basicBack); //ask user back text
    }

    //answer for a "What is a 'back' text of Basic card?"
    case 'back': {
      //inquirer do nothing until basic card created in basicCards$.subscribe function
      return basicBackText$.onNext(ans.answer); 
    }

    //answer for a "What is a 'full' text of Cloze card?"
    case 'full': {
      const fullText = ans.answer;
      clozeFullText$.onNext(fullText);
      return questions$.onNext(
        Object.assign(question.clozeCloze, {
          validate: input => fullText.indexOf(input) > -1
        })
      ); //ask user cloze text with validation
    }

    //answer for a "What is a 'cloze' text of Cloze card?"
    case 'cloze': {
      //inquirer do nothing until cloze card created inside clozeCards$.subscribe function
      return clozeClozeText$.onNext(ans.answer); 
    }

    default:
      return;
  }
});

//created basic card stream
const createBasicCards$ = Rx.Observable
  .zip(basicFrontText$, basicBackText$)
  .map(([front, back]) => new BasicCard(front, back));
  
//created cloze card stream
const createClozeCards$ = Rx.Observable
  .zip(clozeFullText$, clozeClozeText$)
  .do(_ => console.log("WHAT THE HECK"))
  .map(([full, cloze]) => new ClozeCard(full, cloze));

//created cards stream
const createdCards$ = Rx.Observable.merge(createBasicCards$, createClozeCards$)
  .scan((createdCards, card) => [...createdCards, card], [])
  .share();

//initial two cards
const initialCards$ = Rx.Observable.of([
  new BasicCard('Who was the first president of the United States?', 'George Washington'),
  new ClozeCard('Jupiter is the biggest planet.', 'Jupiter')
]);

// initial cards + created cards
const totalCards$ = createdCards$
  .startWith([
    new BasicCard('Who was the first president of the United States?', 'George Washington'),
    new ClozeCard('Jupiter is the biggest planet.', 'Jupiter')
  ]);

// cards display to user
const showCardList$ = Rx.Observable.zip(totalCards$, displayCards$)
  .map(([cards, _]) => {
    return cards.map(card => {
      if(card instanceof BasicCard) return helper.convertToBasicCardChoices(card);
      else return helper.convertToClozeCardChoices(card);
    })
  })
  .map(helper.makeCardChoiceQuestion);

//This stream is for checking user's answer for basic/cloze card front/partial text question
const checkAnswer$ = Rx.Observable
  .zip(selectedCard$ ,answerForCardProblem$)
  .map(([card, answer]) => {
    if (card instanceof BasicCard) return card.back.toLowerCase() === answer.toLowerCase();
    else return card.cloze = answer;
  });

//Subscribe
createdCards$.subscribe(() => {
  questions$.onNext(question.whatDoYouWant);
});

showCardList$.subscribe(q => {
  console.log("Hello")
  questions$.onNext(q);
});

checkAnswer$.subscribe(isCorrect => {
    if(isCorrect) console.log(" - Correct!!!!!");
    else console.log(" - wrong!!!!!");
    questions$.onNext(question.whatDoYouWant);
});