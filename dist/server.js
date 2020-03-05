const express = require('express');
const app = express();

app.use(express.static('./'));

app.get('/*', (req, res) => {
    res.sendFile('./index.html', { root: __dirname });
});

app.listen((process.env.PORT || 3000), () => console.log('downwinders app listening on port 3000!'));