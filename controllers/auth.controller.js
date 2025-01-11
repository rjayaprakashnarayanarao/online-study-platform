const AuthService = require('../services/auth.service')

exports.register = async (req, res) => {
  try {
    const user = await AuthService.register(req.body);
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await AuthService.login(email, password);
    res.status(200).json({ message: 'Login successful', user, token });
  } catch (error) {
    console.log("error: ", error);
    res.status(401).json({ message: error.message });
  }
};