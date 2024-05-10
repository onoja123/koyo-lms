console.log = jest.fn();

const User = require('../models/user');
const { login } = require('../controller/userController');

jest.mock('../models/user');

describe('login', () => {
  it('should respond with 200 and call createSendToken when credentials are valid', async () => {
    const req = {
      body: {
        email: 'jehoshaphategbe1@gmail.com',
        password: 'dummytext'
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(), 
    };
    const user = { id: '662bb7d8d2c910e0e9e5db7e', name: 'Jehoshaphat Egbe' };
    User.findByCredentials.mockResolvedValue(user);

    await login(req, res);

    expect(User.findByCredentials).toHaveBeenCalledWith(req.body.email, req.body.password);
    expect(res.status).toHaveBeenCalledWith(200); 
    expect(res.json).toHaveBeenCalled(); 
  });

  it('should respond with 400 when credentials are invalid', async () => {
    const req = {
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    User.findByCredentials.mockRejectedValue(new Error('Invalid credentials'));

    await login(req, res);

    expect(User.findByCredentials).toHaveBeenCalledWith(req.body.email, req.body.password);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalled(); 
  });
});
