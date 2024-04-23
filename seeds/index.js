// seeds/index.js
// we can run this file on its own to feed data to the database
// basically just a "seed file"

const mongoose = require('mongoose')
const cities = require('./cities')
const {descriptors,places} = require('./seedHelpers')
// 注意路径要对上: 这个campground 在上一层
const Campground = require('../models/campground');

mongoose.connect('mongodb://localhost:27017/yelp-camp')

// just copy connection 连接成功与失败的处理
const db = mongoose.connection; // make db shortcut
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

//pick a random element from an arrya
const sample = (arr) =>{
    return arr[Math.floor(Math.random() * arr.length)]
}

const seedDB = async()=>{
    await Campground.deleteMany({}); // delete anything at first
    for(let i=0; i<100; i++){
    // make the location of the camp of the format: city, state
        const random1000 = Math.floor(Math.random()*1000);
        const price = Math.floor(Math.random()*20) +10;
        const camp  =new Campground({
            author: '6616a622da3ea246383b9ccf', // 先找一个已经存在的 set up 为默认的author
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            // 利用自定义method sample(...)来进行对于title的 randomed的组合(descriptors + places)
            title: `${sample(descriptors)} ${sample(places)}`,

            description: 'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Laborum eum ab neque voluptatibus quia iste incidunt eaque reiciendis, in, nostrum beatae, deserunt aut nihil praesentium eos maxime aspernatur quam ratione.',
            price,
            geometry:{
                type: "Point",
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude,
                ]
            },
            images:[
                {
                    url: 'https://media.timeout.com/images/105658195/image.jpg',
                    filename: 'campground/1'
                },
                 {
                    url: 'https://assets.simpleviewinc.com/simpleview/image/upload/c_limit,q_75,w_1200/v1/crm/goldenislesga/campground_BE266D15-5056-A36A-0B1F44CB7987813E-be266bd05056a36_be266d7e-5056-a36a-0b5a1508c6470d5d.jpg',
                    filename: 'campground/2'
                }
            ]
        })
        await camp.save();
    }
}

// 记得要call才能执行
seedDB().then(()=>{
    mongoose.connection.close()
})

