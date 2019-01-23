import * as express from 'express';
import { Request, Response } from "express";
import * as winston from "winston";
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as helmet from 'helmet';
import * as passport from 'passport';
require("dotenv").config();

const app = express();
app.set('viewengine', 'pug');

// add winston to write log
export const logger: any = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: `/logs/combined.log`,
            level: "info"
        })
    ],
    exitOnError: true,
    silent: false
});

if (process.env.NODE_ENV !== "production") {
    logger.add(
        new winston.transports.Console({
            format: winston.format.simple()
        })
    );
}

app.use(
    helmet({
        frameguard: {
            action: "sameorigin"
        },
        dnsPrefetchControl: {
            allow: true
        }
    })
);

// const whitelist: string[] = [
//     'http://localhost:3000',
// ];
// const corsOptions = {
//     origin: (origin, callback) => {
//         if (whitelist.indexOf(origin) !== -1) {
//             callback(null, true);
//         } else {
//             callback(new Error('Not allowed by CORS'));
//         }
//     }
// }
// app.use(cors(corsOptions));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.text());

const db = {
    User: [
        {
            id: '2463619257041574',
            name: 'thquyen11',
            email: 'thquyen11@hotmail.com'
        }
    ]
}

const handleSignin = (profile: any, db: any) => {
    const name = profile.displayName;
    const id = profile.id;

    if (id === db.User[0].id) {
        return Promise.resolve({ id: db.User[0].id, name: name });
    } else {
        return Promise.reject({});
    }
}

const FacebookStrategy = require('passport-facebook').Strategy;
app.use(passport.initialize());
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/callback"
},
    function (accessToken, refreshToken, profile, done) {
        console.log('accessToken ', accessToken);
        console.log('refreshToken', refreshToken);
        console.log('profile', profile);
        handleSignin(profile, db)
            .then((user: any) => {
                return done(null, user);
            })
            .catch((err: any) => done(err))
    }
))
passport.serializeUser(function (user, done) {
    console.log('user ', user);
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    console.log('user ', user);
    done(null, user);
});

// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback
app.get('/auth/facebook', passport.authenticate('facebook'));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/sucess',
    failureRedirect: '/login'
}));

app.get('/', (req: Request, res: Response) => {
    res.render('pugs/index.pug');
})

app.get('/sucess', (req: Request, res: Response) => {
    res.render('pugs/success.pug');
})

// FCC project: Anonymous Message Board
//data model
// const messageBoard=[
//     {
//         id: 0,
//         createdOn: new Date(),
//         bumpedOn: new Date(),
//         reported: false,
//         threads:[
//             {
//                 id: 0,
//                 createdOn: new Date(),
//                 bumpedOn: new Date(),
//                 reported: false,
//                 text: 'hello world',
//                 reply:[
//                     {
//                         id: 0,
//                         createdOn: new Date(),
//                         bumpedOn: new Date(),
//                         reported: false,
//                         text: 'hello world',
//                     }

//                 ]
//             }
//         ]
//     }
// ]

// FCC projects: Metric-Imperial converter
app.get('/api/convert', (req: Request, res: Response) => {
    const input = req.query.input;
    const reVerify = /(?<=\d)\w+|\d(?=\w)/i;
    if (!input.match(reVerify)) {
        res.status(400).send('invalid input');
    }
    const reUnit = /[a-zA-Z]+/;
    const index: number = input.search(reUnit);
    let unit: string = input.slice(index);
    let number: number = eval(input.slice(0, index));

    switch (unit) {
        case 'gal':
            number *= 3.78541;
            unit = 'L';
            break;
        case 'lbs':
            number *= 0.453592;
            unit = 'kg';
            break;
        case 'mi':
            number *= 1.60934;
            unit = 'km';
            break;
        case 'L':
            number *= 1/3.78541;
            unit = 'gal';
            break;
        case 'kg':
            number *= 1/0.453592;
            unit = 'lbs';
            break;
        case 'km':
            number *= 1/1.60934;
            unit = 'mi';
            break;
        default:
            break;
    }

    return res.status(200).json({ convertNum: number, convertUnit: unit })
})

// FCC projects: Stock Price Checker
let dbStock = [
    {
        stock: 'GOOG',
        price: '786.90'
    },
    {
        stock: 'MSFT',
        price: '62.30'
    },

];

app.get('/api/stock-prices', (req: Request, res: Response) => {
    const stocks = req.query.stock;
    console.log('query ', req.query);
    console.log('stocks ', stocks);
    const stockList = [];

    if (typeof stocks === 'string') {
        console.log('stock ', stocks);
        dbStock.map((stockInDB: any) => {
            if (stockInDB.stock === stocks.toUpperCase()) {
                stockList.push(stocks);
            }
        })
    } else {
        stocks.map((stock: any, index: any) => {
            console.log('stock ', stock);
            console.log(typeof stock);
            dbStock.map((stockInDB: any) => {
                if (stockInDB.stock === stock.toUpperCase()) {
                    stockList.push(stock);
                }
            })
        })
    }
    return res.status(200).json({ stockData: stockList });
})

// FCC projects: Personal Library
let dbBooks = [
    {
        id: '0',
        title: 'test book',
        commentCount: 10
    }
]

app.delete('/api/books', (req: Request, res: Response) => {
    dbBooks = [];
    return res.status(200).send('all book deleted');
})

app.delete('/api/books/:id', (req: Request, res: Response) => {
    const { id } = req.params;

    for (let i: number = 0; i < dbBooks.length; i++) {
        if (dbBooks[i].id === id) {
            dbBooks.splice(i, 1);
            return res.status(200).send(`book id ${id} deleted`);
        }
    }
    return res.status(400).send(`book id ${id} not existed`);
})

app.post('/api/books', (req: Request, res: Response) => {
    const { title, comment } = req.body;

    dbBooks.map((book: any, index: any) => {
        if (title === book.title) return res.status(400).json({ title: title, post: 'false' })
    })

    dbBooks.push({
        id: dbBooks.length.toString(),
        title: title,
        commentCount: 0
    })
    return res.status(200).json({ title: title, post: 'success' })
})

app.post('/api/books/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, comment } = req.body;

    dbBooks.map((book: any, index: any) => {
        if (id === book.id) {
            book.commentCount++;
            return res.status(200).send(`add comment to book id ${id}`);
        } else return res.status(400).send(`book id ${id} not found`);
    })
})

app.get('/api/books', (req: Request, res: Response) => {
    return res.status(200).json({ bookList: dbBooks });
})

app.get('/api/books/:id', (req: Request, res: Response) => {
    const { id } = req.params;

    dbBooks.map((book: any, index: any) => {
        if (id === book.id) return res.status(200).json({ book: book });
    })
    return res.status(400).send(`book id ${id} not found`);
})

// FCC project: Issue Trackers
const dbIssues = [
    {
        projectName: 'TEST',
        issueId: 0,
        issueTitle: 'test',
        issueText: 'test',
        createdBy: 'QuyenHo',
        assignedTo: '',
        statusText: '',
        createdOn: new Date('20190121'),
        updatedOn: new Date('20190122'),
        open: true
    },
]

app.get('/api/issues/:projectName', (req: Request, res: Response) => {
    const { projectName } = req.params;
    const issueList = [];
    dbIssues.map((issue: any, index: any) => {
        if (issue.projectName === projectName) issueList.push(issue);
    })

    return res.status(200).json({
        projectName: projectName,
        issueList: issueList
    })
})

app.delete('/api/issues/:projectName', (req: Request, res: Response) => {
    const { projectName } = req.params;
    const { id } = req.body;

    if (!id) res.status(400).json({ projectName: projectName, error: '_id error' })
    for (let i = 0; i < dbIssues.length; i++) {
        if (dbIssues[i].projectName === projectName && dbIssues[i].issueId === id) {
            dbIssues.splice(i, 1)
        }
    }
    return res.status(200).json({
        projectName: projectName,
        removed: 'success'
    })
})

app.put('/api/issues/:projectName', (req: Request, res: Response) => {
    const { projectName } = req.params;
    const { id } = req.body;

    if (!id) res.status(400).json({ projectName: projectName, error: '_id error' })
    for (let i = 0; i < dbIssues.length; i++) {
        if (dbIssues[i].projectName === projectName && dbIssues[i].issueId === id) {
            dbIssues[i].updatedOn = new Date();
        }
    }

    return res.status(200).json({
        projectName: projectName,
        updated: 'true'
    })
})

app.post('/api/issues/:projectName', (req: Request, res: Response) => {
    const { projectName } = req.params;
    const issueTitle: string = req.body.issue_title;
    const issueText: string = req.body.issue_text;
    const createdBy: string = req.body.created_by;
    const assignedTo: string | undefined = req.body.assigned_to;
    const statusText: string | undefined = req.body.status_text;

    dbIssues.push({
        projectName: projectName,
        issueId: dbIssues.length,
        issueTitle: issueTitle,
        issueText: issueText,
        createdBy: createdBy,
        assignedTo: assignedTo ? assignedTo : '',
        statusText: statusText ? statusText : '',
        createdOn: new Date(),
        updatedOn: new Date(),
        open: true
    })

    res.status(200).json(dbIssues[dbIssues.length - 1])
})

//Server port
app.listen(process.env.PORT, () => {
    logger.info("Server running on port " + process.env.PORT);
});
