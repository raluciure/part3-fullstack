/* eslint-disable no-undef */
require('dotenv').config()
const express = require('express')
const app = express()
app.use(express.json())

const morgan = require('morgan')
app.use(morgan('tiny'))

const cors = require('cors')
app.use(cors())

app.use(express.static('dist'))

const Person = require('./models/person').default

morgan.token('postResponse', (request) => JSON.stringify(request.body));
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :postResponse'));


app.get('/', (request, response) => {
    response.send('<h1>Hello World!</h1>')
})

app.get('/api/persons', (request, response) => {
    Person.find({}).then(persons => {
        response.json(persons)
    })
})

app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id)
        .then(person => {
            if (person) {
                response.json(person)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndDelete(request.params.id)
        .then(() => {
            response.status(204).end()
        })
        .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
    const body = request.body

    if (!body.name) {
        return response.status(400).json({
            error: 'name missing'
        })
    }

    if (!body.number) {
        return response.status(400).json({
            error: 'number missing'
        })
    }

    Person.findOne({ name: body.name })
        .then(person => {
            if (person) {
                person.number = body.number;
                return person.save();
            } else {
                const newPerson = new Person({
                    name: body.name,
                    number: body.number,
                });
                return newPerson.save();
            }
        })
        .then(savedPerson => {
            response.json(savedPerson);
        })
        .catch(error => next(error));
})

app.put('/api/persons/:id', (request, response, next) => {
    const { name, number } = request.body;

    Person.findByIdAndUpdate(request.params.id, { name, number }, { new: true, runValidators: true, context: 'query' })
        .then(updatedPerson => {
            response.json(updatedPerson);
        })
        .catch(error => next(error));
});


app.get('/info', (request, response) => {
    const time = new Date()
    Person.find({}).then(persons => {
        const sentResponse = `<p>Phonebook has info of ${persons.length} people</p><p>${time}}</p>`;
        response.send(sentResponse);
    });
})

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    }
    else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    }
    next(error)
}

app.use(errorHandler)

 
const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})