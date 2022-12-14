const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

let stringify = require('json-stringify-safe');

const cors = require("cors");
const corsOptions = {
    origin: ['http://localhost:4200']
}
app.use(cors(corsOptions));

const bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({ extended: true }));

const fileName = '../data/list.json';
const filePath = path.join(__dirname, fileName);

// Define how we're going to format the data
import { IItem, IList, IDataPacket, OpCodes } from '../../src/app/items/item';


// the local variable to store the data
// let contactList: IPerson[] = [];
let lol: IList[] = [];

// Load the data from the file into the local variable
fs.readFile(filePath, (err: any, data: any) => {
    if (err) {
        console.error('Unable to file : ' + filePath);
    } else {
        lol = JSON.parse(data);
        //        lol = lol.sort((a, b) => (a.id < b.id) ? -1 : 1);
        lol.forEach(function (list) {
            console.log("processing list: " + list.listname);
            list.items.forEach(function (item) {
                let newIID = Math.floor(Math.random() * 5000) + 1;
                console.log("Adding IID: " + newIID.toString() + " to: " + item.productName);
                (item as any).iid = newIID;
            });
        });
        console.log("lol file updated on load.");
        fs.writeFileSync(filePath, JSON.stringify(lol, null, 4));
    }
});

// set the port
const port = process.env.PORT || 4201;

// Get with no parameters, return the list of list names
app.get('/', (req: any, res: any) => {
    console.log("Get request received: ", stringify(req.params));
    let nameMetadata: IList[] = JSON.parse(JSON.stringify(lol));

    // Return just the metadata
    nameMetadata.forEach(function (val) {
        val.items = [];
    })

    console.log("Returning " + JSON.stringify(nameMetadata).slice(0, 25));
    res.status(200);
    return res.json(JSON.stringify(nameMetadata));
});

// Get with listname parameter to return all items from a singular list
app.get('/:listname', (req: any, res: any) => {
    console.log("Get:listname request received: ", stringify(req.params));
    if (req.params.listname) {
        let subList = lol.find(l => l.listname == req.params.listname);
        console.log("List found: " + JSON.stringify(subList));
        if (subList) {
            res.status(200);
            console.log("Returning " + JSON.stringify(subList).slice(0, 25));
            return res.json(subList);
        }
    }
    console.log("Returning 404 error.");
    res.status(404);
    return res.json({ error: 'No list with name: ' + res.params.listname + ' found!' });
});

// Get with listname parameter to return all items from a singular list
app.get('/:listname/:itemid', (req: any, res: any) => {
    console.log("Get:listname:itemid request received: ", stringify(req.params));
    if (req.params.listname) {
        let subList = lol.find(l => l.listname == req.params.listname);
        console.log("List found: " + JSON.stringify(subList));
        if (subList) {
            let item = subList.items.find(i => i.iid == req.params.itemid);
            res.status(200);
            console.log("Returning " + JSON.stringify(item).slice(0, 25));
            //            return res.json(item);
            return res.json({ "Name": req.params.listname, "data": item });
        }
    }
    console.log("Returning 404 error.");
    res.status(404);
    return res.json({ error: 'No list with name: ' + res.params.listname + ' found!' });
});

// Post endpoint to add n
app.post('/', (req: any, res: any) => {
    let newTransfer: IDataPacket = JSON.parse(JSON.stringify(req.body)) as IDataPacket;

    console.log("POST xfer: " + JSON.stringify(req.body));

    switch (newTransfer.opcode) {
        case OpCodes.AddItem: {
            let subList: IList = lol.find(l => l.listname == newTransfer.listName) as IList;
            subList.items.push(newTransfer.item as IItem);
            console.log("addItem: " + JSON.stringify(subList));
            break;
        }
        case OpCodes.AddList: {
            lol.push(newTransfer.item as IList);
            break;
        }
        case OpCodes.UpdateListMetaData: {
            let subList: IList = lol.find(l => l.listname == newTransfer.listName) as IList;
            let newList: IList = newTransfer.item as IList;

            subList.listname = newList.listname;
            subList.listid = newList.listid;
            subList.listaddress = newList.listaddress;
            subList.coverimageurl = newList.coverimageurl;
            break;
        }
        case OpCodes.UpdateListItem: {
            let subList: IList = lol.find(l => l.listname == newTransfer.listName) as IList;
            let updatedItem: IItem = newTransfer.item as IItem;
            let item: IItem = subList.items.find(i => i.iid == updatedItem.iid) as IItem;

            if (subList && item) {
                let index: number = subList.items.indexOf(item);
                subList.items[index] = updatedItem;
            }
            else {
                console.log("Item or List not found: " + JSON.stringify(newTransfer.item));
                res.status(404); // Deliberately chose 405 - Method Not Allowed
                return res.json({ error: `Item or List not found:${newTransfer.listName} ${newTransfer.item}.` });
            }
            break;
        }

        default: {
            console.log("Unrecognized OpCode: " + newTransfer.opcode);
            res.status(404); // Deliberately chose 405 - Method Not Allowed
            return res.json({ error: `unrecognized opcode:${newTransfer.opcode}.` });
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(lol, null, 4));

    return res.sendStatus(200);
});

//TODO Delete command to get rid of items
//app.get('/:listname', (req: any, res: any) => {
app.delete('/', (req: any, res: any) => {
    console.log("blank delete() called");
});

app.delete('/:listname', (req: any, res: any) => {
    console.log("Delete:listname request received: " + JSON.stringify(req.params));

    if (req.params.listname) {
        let subList: IList = lol.find(l => l.listname == req.params.listname) as IList;
        console.log(subList);
        if (subList) {
            let idx = lol.indexOf(subList);
            console.log(idx);
            lol.splice(idx, 1);
            fs.writeFileSync(filePath, JSON.stringify(lol, null, 4));
            return res.sendStatus(200);
        }
        res.status(404);
        return res.json({ error: `List not found:${req.params.listname} not found.` });
    }
    res.status(404);
    return res.json({ error: `Malformed expression:${req.params.listname}` });
});
// app.get('/:listname/:itemid', (req: any, res: any) => {
app.delete('/:listname/:itemid', (req: any, res: any) => {
    console.log("Delete:listname:listid request received: ", stringify(req.params));
    if (req.params.listname && req.params.itemid) {
        let subList: IList = lol.find(l => l.listname == req.params.listname) as IList;
        if (subList) {
            let item: IItem = subList.items.find(i => i.iid == +req.params.itemid) as IItem;
            if(item){
                let idx = subList.items.indexOf(item);
                subList.items.splice(idx, 1);
                fs.writeFileSync(filePath, JSON.stringify(lol, null, 4));
                return res.sendStatus(200);
            }
            res.status(404);
            return res.json({ error: `ItemID: ${req.params.item.iid} not found.` });
        }
        res.status(404);
        return res.json({ error: `List: ${req.params.listname} not found.` });
    }
    res.status(404);
    return res.json({ error: `Malformed Delete Expression: ${req.params.listname}-${req.params.item.iid}` });
});

// Start listening
app.listen(port, () => {
    console.log(`Running on port ${port}`);
});
