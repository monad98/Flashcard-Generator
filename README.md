# Flashcard-Generator
Basic flashcard application with [Inquirer JS](https://github.com/SBoudrias/Inquirer.js/) and [RXJS](https://github.com/ReactiveX/rxjs).

## Quick Start
```bash
#clone the repo
git clone https://github.com/monad98/Flashcard-Generator.git

#change directory to repo
cd Flashcard-Generator

# install dependencies
npm install

#start
npm start (or node app.js)
```

## Included
- [RxJS](https://github.com/ReactiveX/rxjs) - Reactive Extensions Library for JavaScript
- [Inquirer JS](https://github.com/SBoudrias/Inquirer.js/) - A collection of common interactive command line user interfaces.

## Play
- Create Basic/Cloze card

<img alt="Create cards" src="/images/create.png" title="Create cards"/>

```
All created cards are stored in createdCards$ observable
```

- Solve the quiz

<img alt="Solve card problems" src="/images/solve.png" title="Solve cards"/>

```
All created cards are displayed and user select one to solve.
```