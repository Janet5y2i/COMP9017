import api from './api'

async function getQuizQuestion() {
    const result = await api.get('/quiz/questions');

    if (result.success) {
        return result.data;
    }
    else {
        throw new Error("Could not get question data");
    }
}

async function submitAnswer(questionIds, answers) {
    const submitBody = {
        questions: questionIds,
        answers: answers
    };
    
    const res = await api.post('/quiz/submit', submitBody);
    return res.data;
}

async function getLeaderBoard() {

}

async function getAttemptHistory() {

}

export default {
    getQuizQuestion,
    submitAnswer,
    getLeaderBoard,
    getAttemptHistory
}