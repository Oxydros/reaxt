var webpack = require("webpack"), 
    port = require('node_erlastic').port,
    server = require('node_erlastic').server

var client_config = require("./server.webpack.config.js")
var client_compiler = webpack(client_config)
const compilerHooks = client_compiler.hooks

var client_stats,client_err
function maybe_done() {
  if(client_err) port.write({event: "server_done", error: JSON.stringify(client_err)})
  else if(client_stats.hasErrors()) port.write({event: "server_done", error: "soft fail"})
  else    port.write({event: "server_done"})
}

client_compiler.hooks.invalid.tap("reaxt", function() {
  console.warn("[WEBPACK SERVER] Server code is invalid")
  port.write({event: "server_invalid"})
})
compilerHooks.compile.tap("reaxt", function() { 
  console.warn("[WEBPACK SERVER] Server code compiling")
  port.write({event: "server_compile"}) 
})
client_compiler.hooks.failed.tap("reaxt", function(error) {
  client_err = error
  console.error("[WEBPACK SERVER] Server Compilation error")
  maybe_done()
})
client_compiler.hooks.done.tap("reaxt", function(stats) {
  client_stats = stats
  //port.write({event: "hash",hash: stats.hash})
  console.warn("[WEBPACK SERVER] Server Done compiling")

  maybe_done()
  //require("fs").writeFile(process.cwd()+"/../priv/webpack.stats.json", JSON.stringify(stats.toJson()), 
  //    maybe_done)
})
//port.write({event: "invalid"})
client_compiler.watch(100, function(){})
server(function(req,reply_to,state,done){
  //maybe_done() // receive message indicating server compilation end
  done("noreply")
})
