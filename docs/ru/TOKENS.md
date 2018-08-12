# Токены для доступа к API

Foxtan использует [JWT-токены](https://jwt.io/introduction).

Для совершения запросов необходимы два токена: `accessToken` и `refreshToken`. Первый используется для авторизации,
и именно его необходимо включать в запросы. Второй токен используется для продления первого.

Foxtan ожидает наличие `accessToken` в одном из мест, таких как:

- заголовок:
    ```
    X-Access-Token: фыркфыркфырк
    ```

- Cookies:
    ```
    Cookie: accessToken=фыркфыркфырк
    ```

`фыркфыркфырк` обозначает Ваш личный токен. Приоритет отдаётся заголовку.

Пример неподписанных и расшифрованных токенов:

```json
// accessToken для неавторизованного клиента
{
  exp: 1483214400,     // время, после которого токен перестанет быть валидным
  level: 0             // права анонима 
  boards: ['*']
}

// accessToken для авторизованного клиента
{
  exp: 1483214400,
  _id: 100,            // ID пользователя, отсутствует у анонима
  level: 30,           // админ-права
  boards: ['d'],       // ...в разделе /d/
}

// refreshToken
{
  exp: 1514750400,
  _id: 100
}
```



## Получение токенов
Для взаимодействия с Foxtan необходимо получить `accessToken` и `refreshToken`.

#### HTTP-запрос
`GET /api/v1/token.obtain`

#### URL-параметры
Отсутствуют.

#### Ответ
Foxtan возвращает JSON:
```json
{
  accessToken: <JWT>,
  refreshToken: <JWT>,
  expires: 1451592000
}
```

Пользователи без JS получают токены при первом запросе к странице движка.
Это достигается с помощью middleware, что перенаправляет на адрес получения токенов.
Они сохраняются в cookie, и совершается перенаправление на изначальный адрес запроса.
```
  GET <any API request>  <===>  GET /api/v1/token.obtain
```



## Обновление токенов
Токены не вечны, поэтому стоит хотя бы изредка их обновлять.
Для этого Foxtan отправляет параметр expires, который содержит в себе время,
после которого токен будет невалидным.

#### HTTP-запрос
`GET /api/v1/token.renew`

#### URL-параметры
- refreshToken

#### Ответ
Foxtan возвращает свежие токены:
```json
{
  accessToken: <JWT>,
  refreshToken: <JWT>,
  expires: 1451592000
}
```
**Примечание:** обновляются оба токена. Необходимо сохранить новый `refreshToken` для последующих
запросов.



## Запросы с устаревшими токенами
Если запрос к API совершается с устаревшими токенами, есть несколько вариантов развития событий:
- запрос с заголовком `X-Requested-With`
  
  Клиент наверняка использует JS.
  Возвращается ошибка 403, требуется обновить токен и повторить запрос.

- запрос без заголовка

  В большинстве случаев у пользователя отключен JS.
  Возвращается код 302 и перенаправление на страницу обновления токенов.