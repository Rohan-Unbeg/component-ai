// groq api key = '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'


// const Groq = require('groq-sdk');

// const groq = new Groq();
// async function main() {
//   const chatCompletion = await groq.chat.completions.create({
//     "messages": [
//       {
//         "role": "user",
//         "content": "create a contact form in html css in single file only\n"
//       }
//     ],
//     "model": "llama3-70b-8192",
//     "temperature": 1,
//     "max_tokens": 1024,
//     "top_p": 1,
//     "stream": true,
//     "stop": null
//   });

//   for await (const chunk of chatCompletion) {
//     process.stdout.write(chunk.choices[0]?.delta?.content || '');
//   }
// }

// main();

const express = require('express');
const Groq = require('groq-sdk');
const path = require('path');

// Initialize Groq with your API key
const groq = new Groq({ apiKey: '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' });

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));  // Serves static files from the 'public' directory

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/generate-code', async (req, res) => {
    const { prompt } = req.body;

    // Prepare the prompt with context
    // const promptWithContext = `Generate complete HTML and CSS code complete not just sections but complete code in single file itself code for the following component, without any explanations just code: ${prompt}`;
    const promptWithContext = `Generate a complete, single-file HTML document with embedded CSS for the following component. Provide all necessary HTML and CSS code together in one file. Do not include any explanations—just the code. The component to generate is: ${prompt}`;


    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: promptWithContext }],
            model: 'llama3-70b-8192',
            temperature: 0.7,
            max_tokens: 1500,
            top_p: 1,
            stream: false,
            stop: null
        });

        let code = chatCompletion.choices[0]?.message?.content || '';

        // Clean up the code by removing any extraneous characters
        code = code.replace(/\\n/g, '\n')
                   .replace(/\\t/g, '\t')
                   .replace(/\\"/g, '"')
                   .replace(/\\'/g, "'");

        // Send only the code without any JSON formatting
        res.send(code);
    } catch (error) {
        console.error('Error generating code:', error);
        res.status(500).send(`Error generating code: ${error.message || 'Unknown error'}`);
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
