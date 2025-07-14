const path = require('path');
const { PythonShell } = require('python-shell');

async function getReply(model, messages, similarText, specifications, rejection_msg, temperature) {
    const options = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: path.join(__dirname, '../python_scripts/LLM'),
    args: [model, JSON.stringify(messages), JSON.stringify(similarText), specifications, rejection_msg, temperature]
    };

    const result = await PythonShell.run('getReplyInterview.py', options);
    console.log(result);
    return result;
}

function parseLLMResponse(fullResponse) {
    try {
    const jsonString = fullResponse.replace(/```json|```/g, '').trim();
    const responseObj = JSON.parse(jsonString);

    return {
        reply: responseObj.answer,
        relatedQuestions: responseObj.related_questions || []
    };
    } catch (err) {
    console.error('Failed to parse LLM response:', err);
    return {
        reply: fullResponse.replace(/```json|```/g, '').trim(),
        relatedQuestions: []
    };
    }
}

module.exports = {
  getReply,
  parseLLMResponse
};