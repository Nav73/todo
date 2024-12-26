//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
require("dotenv").config()
const path = require('path');
const { name } = require("ejs");

const _ = require("lodash")


const app = express();
const PORT = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, "public")));



mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
const itemSchema = {
  name: String
} 
const Item = mongoose.model("item", itemSchema)

const item1 = new Item ({
  name: "Welcome to todoList"
})
const item2 = new Item({
  name: "click + to add items"
})
const item3 = new Item({
  name: "click [checkbox] to remove items"
})

const defaultItems = [item1, item2, item3]

const listSchema = {
  name: String, 
  items: [itemSchema]
}

const List = mongoose.model("List", listSchema)

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

//read data from database
const foundItems = []

app.get("/", function(req, res) {

  const day = date.getDate();
  Item.find({}).then(foundItems => {
    if(foundItems.length === 0){
      Item.insertMany(defaultItems).then(foundItems => {
        console.log(foundItems)
      }).catch(err => {
        console.log(err)
      })
    }
    // console.log(foundItems)
    res.render("list", {listTitle: day, newListItems: foundItems}); 
  }).catch (err => {
    console.log(err)
  }) 
});

// express route parameters
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  async function findListByName(customListName) {
    try {
      const foundList = await List.findOne({name: customListName})
      if(foundList) {
        console.log("Item found by same list name")
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
        // res.send("hello")
      } else {
        console.log("no list found with the given name")

        const list = new List({
          name: customListName,
          items: defaultItems
        })
        await list.save()
        res.redirect("/" + customListName)
      }
    } catch (err) {
      console.log(err)
    }
  }  
  findListByName(customListName)
  // res.send("hello111")
})

app.post("/", function(req, res){

  async function redirectByListName() {

    const itemName = req.body.newItem;
    const listName = req.body.list;                                                                                               
    console.log(listName)
    console.log(itemName)

    const item = new Item({
      name: itemName
    })

    if(listName === date.getDate()) {
      await item.save()
      res.redirect("/")
    }
    
    else {
      List.findOne({name: listName}).then(async foundList => {
        foundList.items.push(item)
        await foundList.save()
        res.redirect("/" + listName)
      })
    }
  }
  redirectByListName();  
});

app.post("/delete", function(req, res) {
  const checkedItem = (req.body.checkbox)
  const listName = req.body.listName
  console.log("ListName: " + listName)
  console.log("checkedItem: " + checkedItem)


  if(listName === date.getDate()){
    Item.findByIdAndDelete(checkedItem).then(deletedItem => {
      console.log(deletedItem)
      res.redirect("/")
    }).catch(err =>{
      console.log(err)
    })
  }
  else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItem}}}).then(deletedItem => {
      console.log(deletedItem)
      res.redirect("/" + listName)
    }). catch(err => {
      console.log(err)
    })
  }
  
})



app.get("/about", function(req, res){
  res.render("about");
});

// app.listen(PORT, function() {
//   console.log("Server started on port 3000");
// });


module.exports = app;