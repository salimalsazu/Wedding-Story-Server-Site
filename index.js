const express = require('express')
const app = express()
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken')

const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json());



app.get('/', (req, res) => {
    res.send('Hello World!')
})

//mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gfar9jj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }

    const token = authHeader.split(' ')[1]


    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }

        req.decoded = decoded;
        next();
    })

}




async function run() {
    const serviceCollection = client.db('weddingDashboard').collection('service');
    const reviewCollection = client.db('weddingDashboard').collection('reviews');


    try {

        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query).sort({ current: -1 });
            const service = await cursor.toArray();
            res.send(service);
        })

        app.get('/service-home', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query).sort({ current: -1 });
            const service = await cursor.limit(3).toArray();
            res.send(service);
        })


        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const service = await serviceCollection.findOne(query);
            res.send(service);
        })

        app.post('/services', async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result);
        })

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5h' })
            res.send({ token })
        })

        app.get('/allreview', verifyJWT, async (req, res) => {

            const decoded = req.decoded;
            console.log('inside review', decoded)

            if (decoded.email !== req.query.email) {
                res.status(403).send({ message: 'unauthorized access' })
            }
            let query = {}

            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }

            const cursor = reviewCollection.find(query).sort({ current: -1 });
            const review = await cursor.toArray();
            res.send(review);
        })



        app.get('/reviews', async (req, res) => {


            let query = {}


            if (req.query.review) {
                query = {
                    review: req.query.review
                }
                const cursor = reviewCollection.find(query).sort({ current: -1 });
                const review = await cursor.toArray();
                return res.send(review);
            }

            const cursor = reviewCollection.find(query).sort({ current: -1 });
            const review = await cursor.toArray();
            res.send(review);
        })


        app.get('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const review = await reviewCollection.findOne(query);
            res.send(review);
        })



        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        })


        app.put('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const review = req.body;
            const option = { upset: true }
            const updateReview = {
                $set: {
                    rating: review.rating,
                    comment: review.comment,
                    details: review.details
                }
            }

            const result = await reviewCollection.updateOne(filter, updateReview, option)
            res.send(result);
        })


        app.delete('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await reviewCollection.deleteOne(query)
            res.send(result);
        })

    }
    finally {

    }

}
run().catch(error => console.error(error))



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})