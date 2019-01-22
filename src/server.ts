import * as express from 'express';
import { Request, Response } from "express";
import * as winston from "winston";
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as helmet from 'helmet';
import * as passport from 'passport';
import { isUser } from 'babel-types';
require("dotenv").config();

const app = express();
// app.use('/auth', auth);
app.set('viewengine', 'pug');

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
    clientID: '197825031154291',
    clientSecret: '714f2934fc87986389a0906c3f90970b',
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

const dbIssues=[
    {
        projectName: 'TEST',
        issueId: 0,
        issueTitle: 'test',
        issueText:'test',
        createdBy:'QuyenHo',
        assignedTo:'',
        statusText:'',
        createdOn: new Date('20190121'),
        updatedOn: new Date('20190122'),
        open: true
    },
]

app.get('/api/issues/:projectName', (req:Request, res:Response)=>{
    const { projectName } =req.params;
    const issueList=[];
    dbIssues.map((issue:any, index:any)=>{
        if(issue.projectName===projectName) issueList.push(issue);
    })

    return res.status(200).json({
        projectName: projectName,
        issueList: issueList
    })
})

app.delete('/api/issues/:projectName', (req:Request, res:Response)=>{
    const { projectName }= req.params;
    const { id } = req.body;
    
    if(!id) res.status(400).json({ projectName: projectName, error: '_id error' })
    for(let i=0; i<dbIssues.length; i++){
        if(dbIssues[i].projectName===projectName && dbIssues[i].issueId=== id){
            dbIssues.splice(i,1)
        }
    }
    return res.status(200).json({
        projectName: projectName,
        removed: 'success'
    })
})

app.put('/api/issues/:projectName', (req:Request, res:Response)=>{
    const { projectName }= req.params;
    const { id } = req.body;
    
    if(!id) res.status(400).json({ projectName: projectName, error: '_id error' })
    for(let i=0; i<dbIssues.length; i++){
        if(dbIssues[i].projectName===projectName && dbIssues[i].issueId=== id){
            dbIssues[i].updatedOn=new Date();
        }
    }

    return res.status(200).json({
        projectName: projectName,
        updated: 'true'
    })
})

app.post('/api/issues/:projectName', (req:Request, res:Response)=>{
    const { projectName } = req.params;
    const issueTitle:string = req.body.issue_title;
    const issueText:string = req.body.issue_text;
    const createdBy:string = req.body.created_by;
    const assignedTo:string|undefined = req.body.assigned_to;
    const statusText:string|undefined = req.body.status_text;

    dbIssues.push({
        projectName: projectName,
        issueId: dbIssues.length,
        issueTitle: issueTitle,
        issueText: issueText,
        createdBy: createdBy,
        assignedTo: assignedTo? assignedTo: '',
        statusText: statusText? statusText: '',
        createdOn: new Date(),
        updatedOn: new Date(),
        open: true
    })

    res.status(200).json(dbIssues[dbIssues.length-1])
})




//Server port
app.listen(process.env.PORT, () => {
    logger.info("Server running on port " + process.env.PORT);
});
