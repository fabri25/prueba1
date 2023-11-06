const {Router} = require('express');
const {db} = require('../firebase');
const router = Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage()});
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const bucketName = 'descargalibros1';
const bucket = storage.bucket(bucketName);
const admin = require('firebase-admin');

router.get('/', (req, res) => {
    res.render('index');
});

router.post('/', async (req, res) => {
    const { email, password } = req.body; // Asegúrate de que el nombre del campo en tu formulario sea 'email', no 'user'
    
    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();
        if (snapshot.empty) {
            return res.status(401).send('No existe un usuario con ese correo electrónico.');
        }
        
        let user;
        snapshot.forEach(doc => {
            user = doc.data();
        });
        
        if (user.password === password) {
            // Autenticación exitosa, redirigir al home
            res.redirect('/home');
        } else {
            // Contraseña incorrecta
            res.status(401).send('Contraseña incorrecta.');
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});




router.get('/home', (req, res) => {
    res.render('home');
});

router.get('/book', (req, res) => {
    res.render('book');
});

router.post('/book', upload.single('pdf'), async (req, res) => {
    const { titulo, autor, genero } = req.body;
    const pdf = req.file; // El archivo PDF subido

    if (!pdf) {
        return res.status(400).send('No se subió ningún archivo PDF.');
    }

    const blob = bucket.file(pdf.originalname);
    const blobStream = blob.createWriteStream({
        metadata: {
            contentType: pdf.mimetype,
        },
    });

    blobStream.on('error', (err) => res.status(500).send(err));

    blobStream.on('finish', () => {
        blob.makePublic().then(() => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

            db.collection('books').add({
                titulo,
                autor,
                genero,
                pdfUrl: publicUrl
            })
            .then(() => res.redirect('/catalog'))
            .catch((error) => res.status(500).send(error.message));
        }).catch((error) => res.status(500).send(error.message));
    });

    blobStream.end(pdf.buffer);
});

router.get('/catalog', async (req, res) => {
    const QuerySnapshot = await db.collection('books').get()

    const books = QuerySnapshot.docs.map(doc =>({
        id: doc.id,
        ...doc.data()
    }))
    console.log(books);
    //res.render('./views/index');
    //res.send('Hello');
    res.render('catalog', {books});
});

router.get('/deleteBook/:id', async (req,res) => {
    const QuerySnapshot = await db.collection('books').doc(req.params.id).delete();


   res.redirect('/catalog');
    
});



router.get('/admin', async (req,res) => {
    res.render('admin');
});


router.post('/admin', async (req, res) => {
    const { nombres,apellidos,email, password } = req.body;
    try {
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
        });
        db.collection('users').add({
            nombres,
            apellidos,
            email,
            password
        })
        // Usuario registrado, puedes redirigir o manejar como prefieras
        res.redirect('/');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router;