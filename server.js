require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser'); 
const dns = require('dns'); 
const mongoose = require('mongoose'); 
const mySecret = process.env['DB_URI'];

const url = require('url');

mongoose.connect(mySecret, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false}); 

const ShortUrl = mongoose.model('Url', {
  original_url: String,
  short_url: Number
});


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json()); 

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function(req,res, done){
  if(!req.body.url.includes('https://')){
    res.json({error: 'invalid url'}); 
  }
  else{
  const lookupUrl = req.body.url.replace("https://", ""); 
  dns.lookup(lookupUrl, (err, address, family)=>{
    if(err) res.json({ error: 'invalid url' }); 
    else{
       ShortUrl.countDocuments({}, function(err2, count){
         ShortUrl.findOne({original_url: req.body.url}, function(err3, doc){
           if(doc == null){
             var _shortUrl = new ShortUrl({
               original_url: req.body.url,
               short_url: count + 1
             });
             _shortUrl.save();
             res.json({
               original_url: _shortUrl.original_url,
               short_url: _shortUrl.short_url
             });
           }
             else{
               res.json({
                original_url: doc.original_url, 
                short_url: doc.short_url
              });
             }
           });
         });
     }   
    });
  }    
  });
app.get('/api/shorturl/:urlId', function(req, res){
  ShortUrl.findOne({short_url: req.params.urlId}, function(err, doc){
    if(err !=null || doc == null){
      res.json({error: 	"No short URL found for the given input"});
    } 
    else{
       res.redirect(doc.original_url);    
    }
  });  
});
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});