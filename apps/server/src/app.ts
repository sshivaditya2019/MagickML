// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html
import { feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'
import { koa, rest, bodyParser, errorHandler, parseAuthentication, cors } from '@feathersjs/koa'
import socketio from '@feathersjs/socketio'

import type { Application } from './declarations'
import { configurationValidator } from './configuration'
import { logError } from './hooks/log-error'
import { postgresql } from './postgresql'
import { services } from './services/index'
import channels from './channels'
import swagger from 'feathers-swagger'
import handleSockets from './sockets'
import { configureManager, globalsManager } from '@magickml/engine'

const app: Application = koa(feathers())

// Expose feathers app to other apps that might want to access feathers services directly
globalsManager.registerGlobal('feathers', app)

// Load our app configuration (see config/ folder)
app.configure(configuration(configurationValidator))
app.configure(
  swagger({
    ui: swagger.swaggerUI({}),
    specs: {
      info: {
        title: 'Magick API Documentation',
        description: 'Documentation for the Magick API backend, built with FeathersJS',
        version: '1.0.0'
      }
    }
  })
)

// Set up Koa middleware
app.use(cors())
app.use(errorHandler())
app.use(parseAuthentication())
app.use(bodyParser())

// Configure services and transports
app.configure(rest())

// configures this needed for the spellManager
app.configure(configureManager())
app.configure(
  socketio(
    {
      cors: {
        origin: 'http://localhost:4200',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Authorization'],
        credentials: true
      }
    },
    handleSockets(app)
  )
)
app.configure(postgresql)
app.configure(services)
app.configure(channels)

// Register hooks that run on all service methods
app.hooks({
  around: {
    all: [logError]
  },
  before: {},
  after: {},
  error: {}
})
// Register application setup and teardown hooks here
app.hooks({
  setup: [],
  teardown: []
})

export { app }