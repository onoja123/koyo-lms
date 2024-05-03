const Article = require('../models/article') ; 
const Like = require('../models/like') ; 
const View = require('../models/view') ;
const {
  subscribe,
  pushNotification,
  createNotification,
  editNotification,
  deleteNotification,
  broadcastToUsers,
  getNotificationsOfUser
} = require('../controller/notificationController') 

const like = async (req, res) => {
    try {
        const articleId = req.params.articleId;
        const article = await Article.findById(articleId);
        
        if (!article) {
            return res.status(404).json({ error: "Article not found" });
        }

        const alreadyLike = await Like.findOne({
            likedBy: req.user.id,
            article: articleId,
        });

        if (alreadyLike) {
            return res.status(400).json({ error: "You have already liked this article" });
        }

        const thisLike = await Like.create({
            likedBy: req.user.id,
            article: articleId
        });

        if (!thisLike) {
            return res.status(500).json({ error: "Failed to like this article" });
        }

        const thisView = await View.create({
            personId: req.user.code,
            contentId: article.contentId,
            eventType: "LIKE"
        });

        if (!thisView) {
            return res.status(500).json({ error: "Failed to create view" });
        }

        return res.status(201).send("Success");
    } catch (error) {
        console.error(error);
        return res.status(400).send("Failed to like article");
    }
};


const unlike = async (req, res) => {
    try {
        const articleId = req.params.articleId;
        const article = await Article.findById(articleId);
        
        if (!article) {
            return res.status(404).json({ error: "Article not found" });
        }

        const deleteView = await View.findOneAndDelete({
            personId: req.user.code,
            contentId: article.contentId,
            eventType: "LIKE"
        });

        if (!deleteView) {
            return res.status(400).json({ error: "Failed to delete view" });
        }

        const deletedLike = await Like.findOneAndDelete({ likedBy: req.user.id, article: articleId });
        
        if (!deletedLike) {
            return res.status(400).json({ error: "You can't unlike this article" });
        }

        return res.status(200).send();
    } catch (error) {
        console.error(error);
        return res.status(400).send("Failed to unlike article");
    }
};


module.exports = {like , unlike}
