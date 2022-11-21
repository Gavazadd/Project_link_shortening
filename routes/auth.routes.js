const {Router} = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')
const {check,validationResult} = require('express-validator')
const User = require('../models/User')
const router = Router()

// api/auth/register
router.post(
  '/register',
  [
      check('email','Некоректний email').isEmail(),
      check('password', 'Мінімальна довжина пароля 6 символів').isLength({min: 6})
  ],
  async (req, res) =>{
      try{
          const errors =validationResult(req)

          if (!errors.isEmpty()) {
              return res.status(400).json({
                  errors: errors.array(),
                  message: 'Некоректні дані під час реєстрації'
              })
          }

          const {email, password} =req.body

          const candidate = await User.findOne({email})

          if (candidate){
              return res.status(400).json({message:'Такий користувач вже існує'})
          }

          const hashedPassword = await bcrypt.hash(password, 12)
          const user = new User({email, password: hashedPassword})

          await  user.save()

          res.status(201).json({message:'Користувач успішно створений'})

      } catch (e){
          res.status(500).json({message: 'Щось трапилось, спробуйте знову'})
      }
  })

// api/auth/login
router.post(
  '/login',
  [
      check('email', 'Введіть існуючий email').normalizeEmail().isEmail(),
      check('password', 'Уведіть пароль').exists()
  ],
  async (req, res) =>{
      try{
          const errors =validationResult(req)

          if (!errors.isEmpty()) {
              return res.status(400).json({
                  errors: errors.array(),
                  message: 'Некоректні дані під час входу в систему'
              })
          }

          const {email, password} = req.body

          const user = await User.findOne({email})

          if(!user){
              return res.status(400).json({message: 'Користувача не знайдено'})
          }

          const isMatch = await bcrypt.compare(password, user.password)

          if (!isMatch){
              return res.status(400).json({message: 'Невірний пароль, спробуйте знову'})
          }

          const token = jwt.sign(
            {userId: user.id},
            config.get('jwtSecret'),
            {expiresIn: '1h'}
          )

          res.json({token, userId: user.id})


      } catch (e){
          res.status(500).json({message: 'Щось трапилось, спробуйте знову'})
      }
  })

module.exports = router