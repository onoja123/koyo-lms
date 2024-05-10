const Comment = require('../models/comment') ; 
const Article = require('../models/article') ; 
const View = require('../models/view') ;


const createComment = async (req, res) => {
    try {
        const article = await Article.findById(req.params.articleId);

        if (!article) {
            return res.status(404).json({ error: "Article not found" });
        }

        const newComment = new Comment({
            body: req.body.body,
            createdBy: req.user._id,
            article: req.params.articleId
        });

        await newComment.save();

        await View.create({
            personId: req.user.code,
            contentId: article.contentId,
            eventType: "COMMENT CREATED"
        });

        return res.status(200).send();
    } catch (error) {
        console.error(error);
        return res.status(400).send("Failed to comment on article");
    }
};

const getComment = async (req, res) => {
    try {
      const article = await Article.find({ _id: req.params.articleId });
      if (article.length === 0) {
        res.status(400).send('failed to get comments on Articles');
        return;
      }
  
      const comments = await Comment.find({ article: req.params.articleId }).populate({ path: "createdBy", select: "name photo" });
      res.status(201).send(comments);
    } catch (error) {
      res.status(400).send('failed to get comments on Articles');
    }
  };

const updateComment =  async (req, res) => {
    

    try {
        
        const article = await Article.find({_id:req.params.articleId}) ; 

        if(!article)    
        {
            throw new Error("can\'t find this article");
        }
        const body = req.body.body ; 
        if(!body)
        {
            throw new Error() ; 
        }

        const updatedComment= await Comment.findByIdAndUpdate(
            {_id:req.params.commentId},
            { $set:
                {
                    'body':body , 
                }
            },
        );

        res.status(200).send(updatedComment);    
    } catch (e) {
        res.status(400).send('failed to Update comment');
    }
}

const deleteComment = async (req, res) => {
    try {
        const article = await Article.findById(req.params.articleId);
        
        if (!article) {
            return res.status(404).json({ error: "Article not found" });
        }

        const thisView = await View.findOneAndDelete({
            personId: req.user.code,
            contentId: article.contentId,
            eventType: "COMMENT CREATED"
        });

        if (!thisView) {
            return res.status(404).json({ error: "View not found" });
        }

        const deletedComment = await Comment.findByIdAndDelete(req.params.commentId);

        if (!deletedComment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        res.status(200).send();
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to delete comment");
    }
};


module.exports = {createComment , getComment , updateComment , deleteComment}
