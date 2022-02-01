//esversion: 6

const express = require("express");
const bodyParser = require("body-parser");
const { urlencoded } = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

//--------------connect to mongo DataBase-------------\
mongoose.connect(process.env.MONGO_CON_URI, { useNewUrlParser: true });

//-----------------todo array and Containters----------------
let workList = [];

//--------------------create the express app---------------
expApp = express();

//------------------create a mongoose schema-------------------
const todoSchema = mongoose.Schema({
  item: String,
});

//--------------------create a mongoose model-------------------
const ToDOModel = mongoose.model("todoDB", todoSchema);

const item1 = new ToDOModel({
  item: "Add item with the + Button",
});

const item2 = new ToDOModel({
  item: "<-- For Deleting Item Check the Checkbox",
});

let todo = [item1, item2];

//-----------------------------------new List DataBase------------------------------
//-------creating the new list Schema--------------
const newListSchema = mongoose.Schema({
  listname: String,
  items: [todoSchema],
});

//--------------Creating Model for---------------
const newListModel = mongoose.model("newList", newListSchema);

//-------------setup things
expApp.set("view engine", "ejs");
expApp.use(bodyParser.urlencoded({ extended: true }));
expApp.use(express.static("public"));

//-------------------request area-------------
//-------------------Get request------------
expApp.get("/", (req, res) => {
  ToDOModel.find({}, (err, todoData) => {
    if (err) console.log(err);
    else {
      if (todoData.length === 0) {
        ToDOModel.insertMany(todo, (err, result) => {
          if (err) console.log(err);
        });
      } //----------end of database data checks-----------
    }

    //---------------render the home page if the database has data--------------------

    res.render("index", {
      date: "Today",
      items: todoData,
    });
  }); //-------------------get data from database end-------------------------
});

//--------------------custom list get request route--------------

expApp.get("/:customList", (req, res) => {
  //*********capitalixe the path name so the name conflict not happend*****************
  let customListName = _.capitalize(req.params.customList);

  newListModel.findOne({ listname: customListName}, (err, found_result) => {
    if (!err) {
      if (!found_result) {
        const newListData = new newListModel({
          listname: customListName,
          items: todo,
        });

        newListData.save();
        res.redirect("/" + req.params.customList);
      } else {
        res.render("index", {
          date: customListName,
          items: found_result.items,
        });
      }
    }
  });
});

//-------------------Post request--------------------------
expApp.post("/", (req, res) => {
  let oneItem = req.body.todoItem;
  let listName = req.body.listName;

  //----------adding element to main list----------------
  if (listName === "Today") {
    if (oneItem !== "") {
      let item = new ToDOModel({
        item: oneItem,
      });
      item.save();
    }
    res.redirect("/");
  }
  //adding the item to the other custom lists
  else {
    newListModel.findOne({ listname: listName }, (err, foundItem) => {
      if (!err) {
        if (oneItem !== "") {
          let otherListItem = new ToDOModel({
            item: oneItem,
          });
          foundItem.items.push(otherListItem);
          foundItem.save();
        }
        res.redirect("/" + listName);
      }
    });
  }
});


//------------------Delete todo from list----------------
expApp.post("/delete", (req, res) => {
  let itemId = req.body.deletetodo;
  let deleteListItemName = req.body.listItemDelete;

  if (deleteListItemName === "Today") {
    ToDOModel.deleteOne({ _id: itemId }, (err, result) => {
      if (!err) res.redirect("/");
    });
  } //------------------Delete item of Default Today List
  else {
    newListModel.findOneAndUpdate({ listname: deleteListItemName }, { $pull: { items: { _id: itemId } }},(err, foundItem) => {
        if (!err) {
          
          res.redirect("/" + deleteListItemName);
        }
      }
    );
  } //--------------------Delete the item from a custom list-----------------------------
});

//-------------------server listen code----------------
//*********** heroku ************
let port = process.env.PORT || 5000;

expApp.listen(port, () => {
  console.log(`App Up on ${port}`);
});
