const express = require("express");
const app = express()
const bodyParser = require('body-parser')
const server = require("http").Server(app)
var cookieParser = require('cookie-parser')
app.use(cookieParser())
app.use(bodyParser.json())
app.set("view engine", "ejs")
app.set('views', __dirname + '/views');
app.use(express.static("public"))
app.use(express.urlencoded({extended:true}))

var admin = require("firebase-admin");
var serviceAccount = require("./qr-code-aa74c-bc691b234809.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://qr-code-aa74c.firebaseio.com"
});
var db = admin.firestore();
let adminRef = db.collection("admin")
let students = db.collection("students")
let course = db.collection("course")
let lecturer = db.collection("lecturer")
let attendance = db.collection("attendance")


app.get("/", (req, res) => {

    res.render("index");
});

app.get("/lecturer", (req, res) => {

    res.render("lecturer");
});

app.post('/api/lecturer-login', async (req, res)=>{
    const { uname, pword } = req.body
    lecturer.where("email", "==", uname).where("pword", "==", pword).get().then((querySnapshot) => {
        if(querySnapshot.empty){
            return res.json ({ status: 'error', error: 'Invalid Username/Password'})
        }else{
            return res.json ({ status: 'ok', error: 'Valid Username/Password'})
        }
    })
});

app.post('/api/admin-login', async (req, res)=>{
    const { uname, pword } = req.body
    adminRef.where("uname", "==", uname).where("pword", "==", pword).get().then((querySnapshot) => {
        if(querySnapshot.empty){
            return res.json ({ status: 'error', error: 'Invalid Username/Password'})
        }else{
            return res.json ({ status: 'ok', error: 'Valid Username/Password'})
        }
    })
});

app.get("/dashboard", (req, res) => {
    res.render('dashboard');  
});

app.get("/lecturer-board", (req, res) => {
    res.render('lecturer-board');  
});

app.get("/register-student", (req, res) => {
    const randomPIN = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
    res.render('register-student', { randomPIN: randomPIN, successMessage: '' , errorMessage: '' });  
   
});

app.post("/register-student-api", async (req, res) => {
    const { regno, pin, level } = req.body;
    const randomPIN = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
    try {
        const docRef = await db.collection('students').add({
            name: "",
            regno: regno,
            pin: pin,
            pword: "",
            level: level,
            status: 'FALSE'
        });
        
        res.render('register-student', { randomPIN:randomPIN, successMessage: 'Student registered successfully', errorMessage: '' });
    } catch (error) {
        console.error(error); 
        res.render('register-student', { randomPIN:randomPIN, errorMessage: 'An error occurred during registration', successMessage: '' });
    }
});

app.post("/api/take-attendance", async (req, res) => {
    const { course, level, code,lecemail } = req.body;
    const currentDate = new Date();
    const currentTime = `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`;

    try {
        const docRef = await db.collection('attendance').add({
            status: "OPEN",
            course: course,
            date: currentDate,
            level: level,
            code: code,
            time: currentTime,
            email: lecemail
        });
        return res.json({ status: 'ok', docId: docRef.id, error: 'Success' });
    } catch (error) {
        console.error(error);
        return res.json({ status: 'error', error: error });
    }
    
});

app.post("/api/close-attendance", async (req, res) => {
    const { docid } = req.body;
    
    try {
        attendance.doc(docid).update({status: "CLOSE"}).then(() =>{
            return res.json ({ status: 'ok', error: 'Success'})
        }); 
        return res.json ({ status: 'ok', error: 'Success'})
    } catch (error) {
        console.log(error)
        return res.json ({ status: 'error', error: error})
    }
});

 
app.get("/view-students", (req, res) => {
    students.get().then((querySnapshot) => {
        var id = querySnapshot.docs.map((doc) => ({data: doc.data(), id: doc.id}));
        const objectToArrayx = Object.entries(id)
        var datax = new Map(objectToArrayx)
        res.render('view-student', {result: datax, successMessage: '' , errorMessage: '' });
    })  
});
app.get("/view-students/delete/", async (req, res) => {
    try {
        const id = req.query.id;
        await students.doc(id).delete().then(() => {
            try {
                students.get().then((querySnapshot) => {
                    var id = querySnapshot.docs.map((doc) => ({data: doc.data(), id: doc.id}));
                    const objectToArrayx = Object.entries(id)
                    var datax = new Map(objectToArrayx)
                    res.render('view-student', { result:datax, successMessage: 'Student deleted successfully', errorMessage: '' });
                })  
            } catch (error) {
                
            }
        })
    } catch (error) {
        console.error(error);
    }
});

app.get("/view_lecturer/delete/", async (req, res) => {
    try {
        const id = req.query.id;
        await lecturer.doc(id).delete().then(() => {
            try {
                lecturer.get().then((querySnapshot) => {
                    var id = querySnapshot.docs.map((doc) => ({data: doc.data(), id: doc.id}));
                    const objectToArrayx = Object.entries(id)
                    var datax = new Map(objectToArrayx)
                    res.render('view_lecturer', { result:datax, successMessage: 'Lecturer deleted successfully', errorMessage: '' });
                })  
            } catch (error) {
                
            }
        })
    } catch (error) {
        console.error(error);
    }
});


app.get("/register-lecturer", (req, res) => {
    course.get().then((querySnapshot) => {
        var id = querySnapshot.docs.map((doc) => ({data: doc.data(), id: doc.id}));
        const objectToArrayx = Object.entries(id)
        var datax = new Map(objectToArrayx)
        res.render('register-lecturer', {result: datax, successMessage: '' , errorMessage: '' });
    })    
});

app.post("/register-lecturer-api", async (req, res) => {
    const { name,email,pword, course, level } = req.body;
    const new_course = course.join(', ');
    const new_level = level.join(', ');
    try {
        const docRef = await db.collection('lecturer').add({
            name: name,
            email: email,
            pword: pword,
            course: new_course,
            level: new_level
        });
        res.render('success', { successMessage: 'Lecturer registered successfully', errorMessage: '' });
    
    } catch (error) {
        res.render('success', { successMessage: '', errorMessage: 'Error try again' });
     
    }
});


app.get("/register-course", (req, res) => {
    res.render('register-course', { successMessage: '' , errorMessage: '' });    
});

app.post("/register-course-api", async (req, res) => {
    const { course, level } = req.body;
    try {
        const docRef = await db.collection('course').add({
            course: course,
            level: level
        });
        
        res.render('register-course', { successMessage: 'Course registered successfully', errorMessage: '' });
    } catch (error) {
        console.error(error); 
        res.render('register-course', { errorMessage: 'An error occurred during registration', successMessage: '' });
    }
});

app.get("/view-course", (req, res) => {
    course.get().then((querySnapshot) => {
        var id = querySnapshot.docs.map((doc) => ({data: doc.data(), id: doc.id}));
        const objectToArrayx = Object.entries(id)
        var datax = new Map(objectToArrayx)
        res.render('view-course', {result: datax, successMessage: '' , errorMessage: '' });
    })  
});

app.get("/view-course/delete/", async (req, res) => {
    try {
        const id = req.query.id;
        await course.doc(id).delete().then(() => {
            try {
                course.get().then((querySnapshot) => {
                    var id = querySnapshot.docs.map((doc) => ({data: doc.data(), id: doc.id}));
                    const objectToArrayx = Object.entries(id)
                    var datax = new Map(objectToArrayx)
                    res.render('view-course', { result:datax, successMessage: 'Course deleted successfully', errorMessage: '' });
                })  
            } catch (error) {
                console.log("")
            }
        })
    } catch (error) {
        console.error(error);
    }
});

app.get('/attendence', async (req, res)=>{
    const email = req.query.email;
    lecturer.where("email", "==", email).get().then((querySnapshot) => {
        if(!querySnapshot.empty){
            var id = querySnapshot.docs.map((doc) => ({data: doc.data(), id: doc.id}));
            const objectToArrayx = Object.entries(id)
            var datax = new Map(objectToArrayx)
            res.render('attendence', { result:datax});
        }else{
            res.render('attendence', { result:datax});
        }
    })
});

app.get('/fullscreen', async (req, res)=>{
    const code = req.query.code;
    res.render('fullscreen', { result:code});
});



app.get("/success", (req, res) => {
    res.render('success');
});
app.get("/view-lecturer", (req, res) => {
    lecturer.get().then((querySnapshot) => {
        var id = querySnapshot.docs.map((doc) => ({data: doc.data(), id: doc.id}));
        const objectToArrayx = Object.entries(id)
        var datax = new Map(objectToArrayx)
        res.render('view_lecturer', {result: datax, successMessage: '' , errorMessage: '' });
    })  
});

app.get("/logout", (req, res) => {
    res.redirect("/")
});

app.use((req, res) => {
    res.status(404).render("404");
});


  



server.listen(process.env.PORT || 3030);