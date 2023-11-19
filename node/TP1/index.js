// Creation d'un object Sequlize connecter a un fichier SQlite
const { Sequelize, DataTypes } = require("sequelize");
// Creation d'un object express pour la creation de serveur HTTP
const express = require("express");
const bodyParser = require("body-parser");

// Option 2: Passing parameters separately (sqlite)
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./bdd.sqlite",
});

// Definition du model Person
const Person = sequelize.define("Person", {
  // Model attributes are defined here
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Synchronisation de la base de donnée
Person.sync({ force: true });

// creation d'un controlleur pour les actions sur Person
const personCtrl = {
  async getAll(req, res) {
    res.send(await Person.findAll());
  },

  async create(req, res, next) {
    if (!req.body.firstName || !req.body.lastName) {
      const error = new Error("missing parameter");
      error.code = 400;
      next(error);
    }

    try {
      const person = await Person.create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      });

      res.json(person);
    } catch (err) {
      const error = new Error(err);
      error.code = 500;
      next(error);
    }
  },

  async getById(req, res, next) {
    res.send(await Person.findByPk(req.params.person_id));
  },

  async updateById(req, res, next) {
    // on cherche la personne pour ne pas la rechercher a chaque fois
    const person = await Person.findByPk(req.params.person_id);
    if (!person) {
      const error = new Error("Not found");
      error.code = 404;
      next(error);
    }

    if (req.body.firstName) person.firstName = req.body.firstName;
    if (req.body.lastName) person.lastName = req.body.lastName;

    try {
      person.save();
      res.code = 200;
      res.send(person);
    } catch (error) {
      const err = new Error(error);
      err.code = 500;
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const nb = await Person.destroy({
        where: { id: req.params.person_id },
      });

      if (nb > 0) res.send("Person delete");
      else {
        const error = new Error("Person not found");
        error.code = 404;
        next(error);
      }
    } catch (error) {
      const err = new Error(error);
      err.code = 500;
      next(error);
    }
  },
};

// Creation du server HTTP
const app = express();
const port = 3000;

app.use(bodyParser.json());

// Creation des routes permetant les actions
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// route
app.route("/person").get(personCtrl.getAll).post(personCtrl.create);

app
  .route("/person/:person_id")
  .get(personCtrl.getById)
  .put(personCtrl.updateById)
  .delete(personCtrl.delete);

// ajout d'un middleware de gestion d'erreur
app.use(function (err, req, res, next) {
  res.status(err.code).send(err.messsage);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
