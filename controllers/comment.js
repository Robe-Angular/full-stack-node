'use strict'

var validator = require('validator');
var Topic = require('../models/topic')

var controller = {
	add: function(req, res){
		//Recoger el id del topic de la URL
		var topicId = req.params.topicId
		
		//Find por el id del topic
		Topic.findById(topicId).exec((err, topic) => {
			if(err){
				return res.status(500).send({
					status: 'error',
					message: 'Error en la petición'
				});				
			}
			//Comprobar el objeto usuario y validar datos
			if(!req.body.content){
					return res.status(500).send({
						message: 'El comentario no tiene contenido'
					});	
			}else{
				//Validar los datos
				try{
					var validate_content = !validator.isEmpty(req.body.content);

				}catch(err){
					return res.status(500).send({
						message: 'No has comentado nada'
					});
				}

				if(validate_content){
					
					var comment = {
						user: req.user.sub,
						content: req.body.content,
					}

					//En la propiedad comments del objeto resultante hacer un push
					topic.comments.push(comment);

					//Guardar el topic completo
					topic.save((err) =>{
						if(err){
							return res.status(500).send({
								status: 'error',
								message: 'Error al guardar el comentario' 
							});				
						}
						Topic.findById(topic._id)
							.populate('user')
							.populate('comments.user')
							.exec((err, topic) => {
								if(err){
									return res.status(500).send({
										satus: 'error',
										message: 'error en la petición'
									});
								}
								if(!topic){
									return res.status(404).send({
										satus: 'error',
										message: 'No existe el tema'
									});
								}
								//Devolver el resultado
								return res.status(200).send({
									status: 'success',
									topic
								});				
						});

					});
				}else{
					return res.status(500).send({
						message: 'No se han validado los datos del comentario'
					});	
				}
			}
		});
	},

	update: function(req, res){
		//Conseguir id de comentario que llega de la URL
		var commentId = req.params.commentId;

		//Recoger datos y validar
		var params = req.body;
		//Validar los datos
		try{
			var validate_content = !validator.isEmpty(req.body.content);

		}catch(err){
			return res.status(500).send({
				message: 'No has comentado nada'
			});
		}
		if(!validate_content){
			return res.status(500).send({
				message: 'Falló la validación del comentario'
			});	
		}

		//Find and update de subdocumento
		Topic.findOneAndUpdate({
			"comments._id": commentId
		},{
			"$set":{
				"comments.$[com].content": params.content
			}
		},
		{
			new:true,
			
			upsert: true,
			rawResult: true,

			arrayFilters: [{"com.user": req.user.sub, "com._id": commentId}]
		},
		(err, topicUpdated, raw) => {

			if(err){
				return res.status(500).send({
					status: 'error',
					message: 'error al hacer la consulta'
				});	
			}

			if(!topicUpdated){
				return res.status(404).send({
					status: 'Not found',
					message: 'No hay topics',
					user: req.user.sub,
					commentId
				});	
			}
			var find = 0
			topicUpdated.value.comments.forEach( comment => {
				if( comment._id == commentId  && comment.user == req.user.sub){
					find = 1
				}
			});


			//Devolver los datos
			if(find == 1){
				return res.status(200).send({
					status: "success",
					topicUpdated,
				});	
			}else{
				return res.status(404).send({
					status: 'Not found',
					message: 'No se actualizó el comentario',
					topicUpdated,
					user: req.user.sub,
					commentId
				});		
			}
		});
		
	},

	delete: function(req, res){
		//Sacar el id del topic y del comentario a borrar
		var topicId = req.params.topicId;
		var commentId = req.params.commentId;

		//Buscar el topic
		Topic.findById(topicId, (err, topic) =>{
			if(err){
				return res.status(500).send({
					status: 'error',
					message: 'error al hacer la consulta'
				});	
			}

			if(!topic){
				return res.status(404).send({
					status: 'Not found',
					message: 'No hay topics',
				});	
			}
			//Seleccionar el subdocumento (comentario)
			var comment = topic.comments.id(commentId);
			console.log(comment);
			if(comment.user != req.user.sub){
						return res.status(500).send({
							status: 'error',
							message: 'Debes ser el autor del comentario'
						});	
			}
			//Borrar el comentario
			if(comment){
				comment.remove();

				//Guardar el topic
				topic.save((err) =>{
					if(err){
						return res.status(500).send({
							status: 'error',
							message: 'error al hacer la consulta'
						});	
					}
				
					Topic.findById(topic._id)
						.populate('user')
						.populate('comments.user')
						.exec((err, topic) => {
							if(err){
								return res.status(500).send({
									satus: 'error',
									message: 'error en la petición'
								});
							}
							if(!topic){
								return res.status(404).send({
									satus: 'error',
									message: 'No existe el tema'
								});
							}
							//Devolver el resultado
							return res.status(200).send({
								status: 'success',
								topic
							});				
					});
				});
			}else{
				return res.status(404).send({
					status: 'Not found',
					message: 'No existe el comentario',
				});	
			}		
			
		});
	}
};

module.exports =controller;

