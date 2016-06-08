---
layout: post
title: "Tutorial: Build a web app using Elixir and Dynamo with streaming and concurrency"
date: 2013-04-29 03:38
comments: true
published: true
categories: [elixir, concurrency]
keywords: elixir,erlang,dynamo,concurrent,streaming,server-side events,chunk
description: We are going to build step by step a simple web app that reads to fairy tales through streaming connections and handles multiple simultaneus conections.
---

Althoug I am mostly a Ruby developer, I like to play with unusual (to me) things from time to time, and
concurrent programming is one of them. Functional programming is great for that, and elixir puts all the power
of the Erlang VM in your hands without renounce to a nice and expresive syntax.

<!--more-->

Is well known that Ruby is not a good language to build concurrent code. MRI, the main ruby interpreter,
has a global lock that prevents any code to run in parallel. It is true that other implementations like JRuby
and Rubinius don't have that global lock, but still there are not optimal for concurrency, because the
language itself is not designed for it:

  * Ruby objects are mutable, so it has state. When the code is running in parallel, this may lead to strange
    behaviour and bugs due to unespected race conditions unless you are very carefull. And if you are too.

  * The basic data-types (arrays, strings, hashes) are not prepared for parallel read/write. To solve this problem
    there is a gem called [hamster](https://github.com/harukizaemon/hamster) that provides a set of real
    inmutable structures, but still, is not part of the core.

  * The bast mayority of the libraries are not still thread safe.

In summary, people that are serious about concurrency tends to use real state-less programming languages.
Functional programming shines with all its bright at this, and one of the most popular programming languages
is **Erlang**.

## Erlang
Erlang was created in Ericsson in the late eigties and became opensource in the late nineties. Since then
has grown in popularity for make easier to build fault-tolerant real-time applications. Is untyped, has garbage
collection and works with message passing between processes. Today is more than a language, and has a
virtual machine and a standar library focused in concurrency.

It powers some of the most scalable systems in the world. Probably the best example is Whatsapp, with millions
and millions of messages by minute. You should see [this talk](http://www.erlang-factory.com/conference/SFBay2012/speakers/RickReed) of
Rick Reed if you are curious about how they acomplished this magic.

For me the problem with Erlang is Erlang itself. I don't like it.

## Elixir

When I say that I don't like Erlang I mean that I don't like its syntax. Compared with the expresiviness of
Ruby, Erlang is quite mathematical. This is not unexpected, all functional languages are. But since Erlang
is also a runtime environment that executes bytecode, some other languages were build on top of this virtual
machine on the same way that **groovy** or **scala** run on the java virtual machine.

Jose Valim, a ruby hero and well known programmer ([simple_form](https://github.com/plataformatec/simple_form),
[Devise](https://github.com/plataformatec/devise)...) created [**Elixir**](http://elixir-lang.org/),
a language that compiles to erlang bytecode with a cleaner syntax, clearly inspired by its ruby background,
and day by day is gaining popularity because it makes more pleasant to build Erlang applications.
Besides, it can cohexist with pure erlang and you can call any erlang function without any perfomance
penalty.

## Dynamo

If elixir is ruby, [**dynamo**](https://github.com/elixir-lang/dynamo) is rails. Actually, it is more
similar to sinatra than to rails, but the important thing is that it holds the role of _official_ web
framework for the language.

It uses [cowboy](https://github.com/extend/cowboy), a web server written in pure erlang, so it scales
very well with relatively low resources and is concurrent by conception, on the same way that node.js
is naturally evented and make is interesting to build certain kind of services.

## Requeriments

You need to have erlang installed in your computer in order to install elixir. You can download the
latest erlang environment from [here](https://www.erlang-solutions.com/downloads/download-erlang-otp),
and then proceed to install elixir. I installed it in maxOS with _homebrew_ (`brew install elixir`).
The [official guide](http://elixir-lang.org/getting-started/introduction.html) has this topic covered for all operative systems.

Dynamo requires as well to have installed [rebar](https://github.com/basho/rebar) for compile apps.
Now you can clone elixir repository to create your first app.

## Proof of concept: A Storyteller

Let's build a simple web app. The idea is that I have some fairy tales in _.txt_ files and I want to
create a web service that sends the story to N browsers in chunks, line by line, with one second between them.
I want to have lots of opened connections for a long period of time without bloking new incoming connections
and without make polling from the client side.

To create your first app and get dependencies:

{% codeblock lang:sh %}
# Clone repo and enter its folder
git clone git://github.com/elixir-lang/dynamo.git
cd dynamo
# Get dependencies and run tests
MIX_ENV=test mix do deps.get, test
# Create the project
mix dynamo ~/storyteller
cd ~/storyteller
# Install dependencies. Similar to bundler. Nice!
mix deps.get
# Start the server. By default in localhost:4000
mix server
{% endcodeblock %}

You can go to that url to check that everithing is ok till now.

As with sinatra, dynamo has 2 basic components, the routers, under `web/routers` and the views, under `web/templates`.
From the controller you tell the connection to render one of the avaliable templates.

This is how the main router may look like in order to render the `index.html.eex` template in the root path:

{% codeblock web/routers/application_router.ex %}
defmodule ApplicationRouter do
  use Dynamo.Router

  prepare do
    # Pick which parts of the request you want to fetch
    # You can comment the line below if you don't need
    # any of them or move them to a forwarded router
    conn.fetch([:cookies, :params])
  end

  get "/" do
    conn = conn.assign(:title, "Welcome to Concurrent Story Teller v0.1!")
    render conn, "index.html"
  end

end
{% endcodeblock %}

and the template:

{% codeblock web/templates/index.html.eex lang:html %}
<!DOCTYPE HTML>
<html>
<head>
  <title><%= @title %></title>
  <link href="/static/favicon.ico" rel="icon">
  <link href="/static/storyteller.css" media="all" rel="stylesheet" type="text/css">
  <script src="//ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js"></script>
  <script src="/static/storyteller.js"></script>
</head>
<body>
  <div id="main-container">
    <h1><%= @title %></h3>
    <section class="stories-list">
      <h2>Please, choose a story</h3>
      <article class="story">
        <h3>Red Riding</h3>
        <a href="/red-riding">Read it to me!</a>
      </article>
      <article class="story">
        <h3>Snow white</h3>
        <a href="/snow-white">Read it to me!</a>
      </article>
      <article class="story">
        <h3>Cinderella</h3>
        <a href="/cinderella">Read it to me!</a>
      </article>
    </section>
  <div>
</body>
</html>
{% endcodeblock %}

The extension `.eex` is like the `.erb` for ruby, and the code is also evaluated with `<%= ... %>` or `<% ... %>`.

The static content, like the _favicon.ico_ or the stylesheets/javascript files are served from the `/priv/static` folder
but in the `/static/name-of-my-asset.css` route.

I have 3 fairy tales, **Snow white**, **Red riding** and **cinderella** stored in tree _.txt_ files in the root
folder of the application. I want a page for each of this stories available under the  "/name-of-the-tale" path.

If you have used sinatra or padrino, dynamo handles routing on a very similar way, so you only needs to enroute
that url to a new action

{% codeblock web/routers/application_router.ex %}
  # ....

  get "/:file_name" do
    normalized_title = String.capitalize(String.replace(conn.params[:file_name], "-", " "))
    conn = conn.assign :title, normalized_title
    conn = conn.assign :file_name, conn.params[:file_name]
    render conn, "story.html"
  end

end
{% endcodeblock %}

and create the views

{% codeblock web/layouts/story.html.eex lang:html %}
<!DOCTYPE HTML>
<html>
<head>
  <title><%= @title %></title>
  <link href="/static/favicon.ico" rel="icon">
  <link href="/static/storyteller.css" media="all" rel="stylesheet" type="text/css">
  <script src="//ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js"></script>
  <script src="/static/storyteller.js"></script>
</head>
<body>
  <div id="main-container">
    <h2><%= @title %></h3>
    <section id="chat">
    </section>
    <a class="play" href="/play/<%= @file_name %>">Play!</a>
  <div>
</body>
</html>
{% endcodeblock %}

You have noticed that the variable we assign to the connection with `conn = conn.assign :title, normalized_title`
are can be accessed in the templates as `@title`. It also can seem weird that all the time you are
overwritting the same variable `conn` over and over. This is because in elixir all objects are inmutable.
You can't modify the current connection to assign a variable to it. Instead of this, a new connection object
is returned every time you modify it.

This view can be DRYed using layouts, of course, but is ok for now.
This view has a link to **/play/name-of-the-story**, the action that will send the chunked content.

{% codeblock web/routers/application_router.ex %}
  # ....

  get "/play/:story_name" do
    conn = conn.resp_content_type("text/event-stream")
    conn = conn.send_chunked(200)

    iterator = File.iterator!("#{conn.params[:story_name]}.txt")

    Enum.each iterator, fn(line) ->
      { :ok, conn } = conn.chunk "data: #{line}\n"
      await conn, 1000, on_wake_up(&1, &2), on_time_out(&1)
    end
    conn
  end

  defp on_wake_up(arg1, arg2) do
    # Nothing
  end

  defp on_time_out(arg1) do
    # Nothing
  end
{% endcodeblock %}

With this code I set the response header to **text/event-stream** because we want to use some javascript
in the client side to listen to the new chunks without polling.
The `conn.set_chunked(200)` returns a new connection prepared to send chunks, with **transfer-encoding: chunked**
and **connection: keep-alive**.
The `conn.chunk "message"` call sends a chunk the given message and returns a tuple, that can be
`{ :ok, conn }` or `{ :error, failure }`. Assigning the tuple to `{ :ok, conn }` saves the connection and
will raise an error if the first element of the tuple is no `:ok`, which means that something went wrong.

Now let's test out code. The **curl** command is perfec for this.

{% codeblock %}
curl -i http://localhost:4000/play/cinderella
HTTP/1.1 200 OK
transfer-encoding: chunked
connection: keep-alive
server: Cowboy
date: Mon, 29 Apr 2013 15:12:27 GMT
content-type: text/event-stream; charset=utf-8
cache-control: max-age=0, private, must-revalidate

data: Once upon a time... there lived an unhappy young girl.
data: Unhappy she was, for her mother was dead, her father
data: had married another woman, a widow with two daughters,
data: and her stepmother didn't like her one little bit. All
data: the nice things, kind thoughts and loving touches were
data: for her own daughters. And not just the kind thoughts
# ...
{% endcodeblock %}


Aparently it works! Now lets do some javascript.

{% codeblock /priv/static/storyteller.js %}
$(function(){
  $('.play').on('click', function(ev){
    ev.preventDefault();
    var source = new EventSource(this.href);
    source.addEventListener('message', function(e) {
      var $line = $('<p class="story-line">' + e.data + '</p>');
      $line.appendTo('#chat').hide().fadeIn(200, function(){
        $("html, body").animate({ scrollTop: $(document).height() }, "slow");
      })
    }, false);
  });
});
{% endcodeblock %}

I catch the click on the "Play" link and create an event source that receives the chunks from the server.
Each time a chunk is received it is appended in a reserved area with some fancy animations.

Let's test it in the browser:

{% youtube 1lALr-Wulbg %}

Cool, ah?

I encourage you to play with both, elixir and dynamo. Is maybe more suitable for concurrency newbies
(as I am) than stand alone elixir, and allows your to build read things in a snap.

You can find the application in [my github](https://github.com/cibernox/storyteller). Fork it!





