const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const pool = require('../db/pool');

passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );
      const user = rows[0];
      if (!user) return done(null, false, { message: 'Invalid email or password' });

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return done(null, false, { message: 'Invalid email or password' });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);


passport.serializeUser((user, done) => done(null, user.id));


passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [id]
    );
    done(null, rows[0] || false);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;