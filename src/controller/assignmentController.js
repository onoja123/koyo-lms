const { update } = require('../models/Assignments');
const Assigment = require('../models/Assignments');



const createAssignment = async (req, res) => {
    const role = req.user.role;

    if (role === 'instructor') {
        try {
            let ass = new Assigment(req.body);
            if (!ass) {
                throw new Error('Error creating assignment.');
            }
            ass.createdAt = new Date();
            ass.createdBy = req.user.id;
            await ass.save();
            return res.status(201).send(ass);
        } catch (e) {
            console.error("Error creating assignment:", e);
            return res.status(400).send({ error: "Could not create assignment." });
        }
    } else {
        return res.status(403).send('You are not allowed to create assignments.');
    }
};




const getAllAssignment = async (req, res) => {

    try {
        let myAssignment;
        if (req.user.role === 'instructor') {
            myAssignment = await Assigment.find({ createdBy: req.user._id });
        }
        else if (req.user.role === 'student') {
            myAssignment = await Assigment.find({ createdBy: req.user._id, visiable: true });
        }
        else {
            throw new Error('You can\'t open this assignment');
        }
        if (!myAssignment) {
            throw new Error('There is no assignment for you');
        }
        res.status(200).send(myAssignment);
    } catch (e) {
        res.status(400).send('there is no assignment for this course')
    }
}


const getAssignment = async (req, res) => {
    try {
        let myAssignment;
        let Assignment_id = req.params.assigmentId;
        if (req.user.role === 'instructor') {
            myAssignment = await Assigment.findOne({ _id: Assignment_id });
        }
        else if (req.user.role === 'student') {
            myAssignment = await Assigment.findOne({ _id: Assignment_id, visiable: true });

        }
        else {
            throw new Error('You can\'t open this assignment');
        }
        if (!myAssignment) {
            throw new Error('There is no assignment for you');
        }
        res.status(200).send(myAssignment);
    } catch (e) {
        res.status(400).send('there is no assignment for this course')
    }
}


const editStatusForAssignment = async (req, res) => {
    try {
        const id = req.params.assigmentId;
        const updateAssignment = await Assigment.findOneAndUpdate(
            { _id: id ,createdBy: req.user._id},
         
            {
                visiable:!this.visiable
            } ,{
                new: true
              }
        );

        console.log(updateAssignment);
        if (!updateAssignment) {
            throw new Error('updated Assignment is not updated');
        }
        res.status(200).send(updateAssignment);
    }
    catch (e) {
        res.status(400).send();
        console.log(e);
    }
}



const showAssignment = async (req, res) => {
    try {
        const id = req.params.assigmentId;
        const updateAssignment = await Assigment.findOneAndUpdate(
            { _id: id ,createdBy: req.user._id},
         
            {
                visiable:!this.visiable
            } ,{
                new: true
              }
        );
        if (!updateAssignment) {
            throw new Error('updated Assignment is not updated');
        }
        
        res.status(200).send(updateAssignment);
    }
    catch (e) {
        res.status(400).send();
        console.log(e);
    }
}


const editDateForAssignment = async (req, res) => {
    try {
        const id = req.params.assigmentId;
        const updateAssignment = await Assignment.findByIdAndUpdate(
            { _id: id },
            { createdBy: req.user._id },
            {
                $set:
                {
                    startedAt: req.body.startAt,
                    expiredAt: req.body.expiredAt
                }
            },
        );
        console.log(updateAssignment);
        if (!updateAssignment) {
            throw new Error('updated Assignment is not updated');
        }
        res.status(200).send(updateAssignment);
    }
    catch (e) {
        res.status(400).send();
        console.log(e);
    }
}




// const deleteAssignment = async (req, res) => {
//     const role = req.user.role;
//     const id = req.params.assignmentId; // corrected variable name
//     if (role === 'instructor') {
//         try {
//             const assignment_delete = await Assignment.findOne({ _id: id, createdBy: req.user._id });
//             if (!assignment_delete || assignment_delete.createdBy.toString() !== req.user._id.toString()) {
//                 throw new Error('Error: Assignment not found or unauthorized to delete.');
//             }

//             await assignment_delete.remove(); // use await to ensure the removal is completed
//             return res.status(204).send("Assignment deleted"); // use 204 for successful deletion
//         } catch (e) {
//             console.error(e); // log the error for debugging
//             return res.status(400).send("Error deleting assignment: " + e.message); // send error message to client
//         }
//     } else {
//         return res.status(403).send('You are not allowed to delete assignments.'); // 403 for forbidden
//     }
// };

const deleteAssignment = async (req, res) => {
    const role = req.user.role;
    const id = req.params.id;
  
    try {
        if (role === 'instructor') {
            const assignment = await Assignment.findById(id);
  
            if (!assignment) {
                return res.status(400).json({ error: 'Assignment not found.' });
            }
  
            await Assignment.findByIdAndDelete(id);
  
            return res.status(200).json({
                success: true,
                message: 'Assignment deleted successfully.',
                data: null,
            });
        } else {
            return res.status(403).json({ error: 'You are not allowed to delete assignments.' });
        }
    } catch (err) {
        console.error("Error deleting assignment:", err);
        return res.status(500).json({ error: "Could not delete assignment." });
    }
};

  




module.exports = { createAssignment, getAllAssignment, getAssignment, showAssignment, editStatusForAssignment, editDateForAssignment, deleteAssignment };