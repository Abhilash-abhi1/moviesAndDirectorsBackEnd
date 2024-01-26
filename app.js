const express = require('express')
const app = express()
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbPath = path.join(__dirname, 'moviesData.db')

app.use(express.json())

let db = null
const initializeAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    console.log('Database connected')
  } catch (e) {
    console.error(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeAndServer()

const convertMovieDbResponseToObjectResponse = dbObj => {
  return {
    movieId: dbObj.movie_id,
    directorId: dbObj.director_id,
    movieName: dbObj.movie_name,
    leadActor: dbObj.lead_actor,
  }
}

const convertDirectorDbReponseToObjectResponse = dbObj => {
  return {
    directorId: dbObj.director_id,
    directorName: dbObj.director_name,
  }
}

app.get('/movies/', async (request, response) => {
  const getAllMoviesQuery = `SELECT movie_name FROM movie `
  const movieArray = await db.all(getAllMoviesQuery)
  response.send(
    movieArray.map(eachmovie => ({movieName: eachmovie.movie_name})),
  )
})

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getMovieQuery = `SELECT * FROM movie WHERE movie_id = ${movieId}`
  const movie = await db.get(getMovieQuery)
  response.send(convertMovieDbResponseToObjectResponse(movie))
})

app.post('/movies/', async (request, response) => {
  const {directorId, movieName, leadActor} = request.body
  const postMovieQuery = `
    INSERT INTO movie (director_id, movie_name, lead_actor)
    VALUES (${directorId}, '${movieName}', '${leadActor}')
  `
  await db.run(postMovieQuery)
  response.send('Movie Successfully Added')
})

app.put('/movies/:movieId/', async (request, response) => {
  const {directorId, movieName, leadActor} = request.body
  const {movieId} = request.params
  const UpdateMovieQuery = `
  UPDATE movie
            SET
              director_id = ${directorId},
              movie_name = '${movieName}',
              lead_actor = '${leadActor}'
            WHERE movie_id = ${movieId};`
  await db.run(UpdateMovieQuery)
  response.send('Movie Details Updated')
})

app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteMovieQuery = `DELETE FROM movie WHERE movie_id = ${movieId}`
  await db.run(deleteMovieQuery)
  response.send('Movie Removed')
})

app.get('/directors/', async (request, response) => {
  const getAllDirectorsQuery = `SELECT * FROM director`
  const directorsArray = await db.all(getAllDirectorsQuery)
  response.send(
    directorsArray.map(eachDirector =>
      convertDirectorDbReponseToObjectResponse(eachDirector),
    ),
  )
})

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const getDirectorMoviesQuery = `SELECT movie_name FROM movie WHERE director_id = ${directorId}`
  const movies = await db.all(getDirectorMoviesQuery)
  response.send(movies.map(movie => ({movieName: movie.movie_name})))
})

module.exports = app
