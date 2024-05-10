const Follow = require('../models/follow');
const Article = require('../models/article');
const User = require('../models/user');
const View = require('../models/view') ;
// const {
//   subscribe,
//   pushNotification,
//   createNotification,
//   editNotification,
//   deleteNotification,
//   broadcastToUsers,
//   getNotificationsOfUser
// } = require('../notificationController/notificationController') 

const followUser = async (req, res) => {
    try {
        const article = await Article.findById(req.params.articleId);
        
        if (!article) {
            return res.status(404).json({ error: "Article not found" });
        }

        const userToFollow = await User.findById(article.authorPersonId);
        
        if (!userToFollow) {
            return res.status(404).json({ error: "User to follow not found" });
        }

        if (req.user.id === userToFollow.id) {
            return res.status(400).json({ error: "You can't follow yourself" });
        }

        const existingFollow = await Follow.findOne({
            user: req.user._id,
            follows: userToFollow._id,
        });

        if (existingFollow) {
            return res.status(400).json({ error: "You already follow this user" });
        }

        const newFollow = new Follow({ user: req.user._id, follows: userToFollow._id });
        await newFollow.save();

        await View.create({
            personId: req.user.code,
            contentId: article.contentId,
            eventType: "FOLLOW"
        });

        return res.status(200).send();
    } catch (error) {
        console.error(error);
        return res.status(400).send("Failed to follow author");
    }
};


const followers = async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User.findOne({ username: username });
        if (!user) {
            throw new Error('user not founded ')
        }
        const myfollowers = await Follow.find({ follows: user._id }).populate({
            path: "user",
            select: "username"
        }).select("user");

        res.status(200).send(myfollowers);
    } catch (e) {
        res.status(404).send()
    }
}


const follows = async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User.findOne({ username: username });
        if (!user) {
            throw new Error('user not founded ')
        }
        const myfollowers = await Follow.find({ user: user._id }).populate({
            path: "follows",
            select: "username"
        }).select("follows");

      

        res.status(200).send(myfollowers);
    } catch (e) {
        res.status(404).send()
    }
}

const unfollow = async (req, res) => {
    try {
        const article = await Article.findById(req.params.articleId);
        
        if (!article) {
            return res.status(404).json({ error: "Article not found" });
        }
        
        const userToUnfollow = await User.findById(article.authorPersonId);
        
        if (!userToUnfollow) {
            return res.status(404).json({ error: "User to unfollow not found" });
        }

        if (req.user._id === userToUnfollow.id) {
            return res.status(400).json({ error: "You can't unfollow yourself" });
        }

        await View.findOneAndDelete({
            personId: req.user.code,
            contentId: article.contentId,
            eventType: "FOLLOW"
        });

        const existingFollow = await Follow.findOneAndDelete({
            user: req.user._id,
            follows: userToUnfollow._id,
        });

        if (!existingFollow) {
            return res.status(400).json({ error: "You don't follow this user" });
        }

        return res.status(200).send();
    } catch (error) {
        console.error(error);
        return res.status(400).send("Failed to unfollow");
    }
};



module.exports = { followUser, unfollow, followers, follows  }