const Rx = require('rx'); // inquirer support only rxjs 4.x
const inquirer = require('inquirer');
const BasicCard = require('./basic-card');
const ClozeCard = require('./cloze-card');
const question = require('./questions')

//inquirer bottom bar
// const bottomBar = new inquirer.ui.BottomBar();

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


//옵저버블은 인풋을 컨트롤 하는게 아니다??? 에그헤드 비디오 보기.

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

answers$.subscribe(ans => {
  switch (ans.name) {
    case 'action': {
      if (ans.answer === 'create') return questions$.onNext(question.cardQuestion); //ask which card do you want to create
      
      // user selected display
      // we convert both cards streams to observable<Array<question>> and then push this to the question stream
      else return displayCards$.onNext();
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
      answerForCardProblem$$(ans.answer); //wait until answer check
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

//This stream keeps all basic cards history
const createBasicCards$ = Rx.Observable
  .zip(basicFrontText$, basicBackText$)
  // .startWith(['Who was the first president of the United States?', 'George Washington'])
  .scan((cards, [front, back]) => [...cards, new BasicCard(front, back)], []);

//This stream keeps all cloze cards history
const createClozeCards$ = Rx.Observable
  .zip(clozeFullText$, clozeClozeText$)
  // .startWith(['Jupiter is the biggest planet.', 'Jupiter'])
  .scan((cards, [full, cloze]) => [...cards, new ClozeCard(full, cloze)], [])
  .share();

//This stream is for checking user's answer for basic/cloze card front/partial text question
const checkAnswer$ = Rx.Observable
  .zip(selectedCard$ ,answerForCardProblem$)
  .map(([card, answer]) => {
    if (card instanceof BasicCard) return card.back.toLowerCase() === answer.toLowerCase();
    else return card.cloze = answer;
  })
  .share();
  

createBasicCards$.subscribe(basicCards => {
  // questions$.onNext(question.whatDoYouWant);
});

createClozeCards$.subscribe(clozeCards => {
  // questions$.onNext(question.whatDoYouWant);
});

checkAnswer$.subscribe(isCorrect => {
    // if(isCorrect) bottomBar.log.write("Correct!!!!!");
    // else bottomBar.log.write("wrong!!!!!");
    questions$.onNext(question.whatDoYouWant);
  });

cards$ = Rx.Observable.merge(createBasicCards$, createClozeCards$) //TODO: to one observable
initialCards$ = Rx.Observable.of(
  convertToBasicCardChoices(new BasicCard('Who was the first president of the United States?', 'George Washington')),
  convertToClozeCardChoices(new ClozeCard('Jupiter is the biggest planet.', 'Jupiter'))
);

displayCards$
  .flatMapLatest(() => 
    Rx.Observable.merge( //convert each card to inquirer choice object and concatenate both cards choices stream
          cards$,
          initialCards$
        )
        // .do(_ => console.log(_))
        .take(1)
        .toArray() //Creates a list from cards choices sequence
        // .do(_ => console.log(_))
        .map(makeCardChoiceQuestion) // convert cardChoices to card select question
  )
  .subscribe(q => {
    console.log(q);
    // questions$.onNext(q);
  }); //ask "Choose a card to solve."