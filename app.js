const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
var items = ["Buy Food","Cook Food","Eat Food"];
let workItems = [];
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
mongoose.connect("mongodb+srv://Jiaomin:yjm5396213@cluster0.qgr0qik.mongodb.net/todolistDB", { useNewUrlParser: true }).then(
  function () {
    console.log('DB connected!!!');
  }).catch(e => console.log('could not connect to mongodb', e));
const itemsSchema =new mongoose.Schema( {
  name: String
});

const Item = mongoose.model("Item",itemsSchema);
console.log("create schema");
const item1 = new Item({
  name:"Welcome to your todolist"
});
const item2 = new Item({
  name:"Hit the + button to add a new item."
});
const item3 = new Item({
  name:"<-- Hit this to delete an tiem."
});

const defaultItems = [item1, item2, item3];
const listSchema = {
  name:String,
  items:[itemsSchema]
};
const List = mongoose.model("List",listSchema);

app.get("/",function(req,res){
  Item.find().then(function(items){
    if(items.length === 0){
      Item.insertMany(defaultItems).then(function () {
          console.log("Successfully saved defult items to DB");
        }).catch(function (err) {
          console.log(err);
        });
        res.redirect("/");
    }else{
      res.render("list", {listTitle:"Today",newItemsList:items});
    }
  }).catch(function (err) {
    console.log(err);
  });
});
app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name:customListName}).then(function (findList) {
    if(!findList){
      console.log("Doesn't exist!");
      const list = new List({
        name:customListName,
        items:defaultItems
      })
      list.save();
      res.redirect("/"+customListName);
    }else{
      res.render("list",{listTitle:findList.name,newItemsList:findList.items})
    }
  });
})
app.post("/",function(req,res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name:itemName
  });
  if(listName=="Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name:listName}).then(function(findList){
    findList.items.push(item);
    findList.save();
    res.redirect("/" + listName)
  });
  }
});
app.post("/delete",function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today"){
    Item.findByIdAndDelete(checkedItemId).then(function () {
        console.log("Successfully delete");
      }).catch(function (err) {
        console.log(err);
      });
      res.redirect("/");
  }else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}}).then(function(doc, err){
      if (err)
       res.send(err);
      res.redirect("/" + listName);
    });
  }
});
app.get("/work",function(req,res){
  res.render("list",{listTitle:"work list", newItemsList:workItems});
});
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port,function(){
  console.log("Server has started successfully!");
});
