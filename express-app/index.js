const express = require('express')
const session = require('express-session')

const path = require('path')
const app = express()
const port = 3000

app.use(express.urlencoded({ extended: false }))
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: 'secret!'
}))

app.use(function(req, res, next){
  var err = req.session.error;
  var msg = req.session.success;

  delete req.session.error;
  delete req.session.success;

  res.locals.message = '';

  if (err) res.locals.message = '<p class="msg-err">' + err + '</p>';
  if (msg) res.locals.message = '<p class="msg-suc">' + msg + '</p>';

  next();
})

var users = {
  tavro: { name: 'tavro' }
}

hash({ password: 'secret!' }, function (err, pass, salt, hash) {
  if (err) throw err;

  users.tavro.salt = salt;
  users.tavro.hash = hash;
})

function authenticate(name, pass, fn) {
  if (!module.parent) console.log('authenticating %s:%s', name, pass);
  var user = users[name];
  if (!user) return fn(null, null)
  hash({ password: pass, salt: user.salt }, function (err, pass, salt, hash) {
    if (err) return fn(err);
    if (hash === user.hash) return fn(null, user)
    fn(null, null)
  });
}

function restrict(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}

app.get('/', function(req, res){
  res.redirect('/login');
});

app.get('/restricted', restrict, function(req, res){
  res.send('restricted area, <a href="/logout">logout</a>');
});

app.get('/logout', function(req, res){
  req.session.destroy(function(){
    res.redirect('/');
  });
});

app.get('/login', function(req, res){
  res.render('login');
});

app.post('/login', function (req, res, next) {
  authenticate(req.body.username, req.body.password, function(err, user){
    if (err) return next(err)
    if (user) {
      req.session.regenerate(function(){
        req.session.user = user;
        req.session.success = 'authenticated as ' + user.name
          + ' <a href="/logout">logout</a>. '
          + ' you may now access <a href="/restricted">/restricted</a>.';
        res.redirect('back');
      });
    } else {
      req.session.error = 'authentication failed, please check your '
        + ' username and password.'
        + ' (use "tavro" and "secret!")';
      res.redirect('/login');
    }
  });
});

if (!module.parent) {
  app.listen(3000);
  console.log('express started on port 3000');
}