window.addEventListener("DOMContentLoaded", function() {
	var links = document.body.querySelectorAll("a[src]");
	for(var i = 0; i < links.length; i++)
	{
		links[i].href = "/index.html?p=" + encodeURIComponent(links[i].getAttribute("src"));
		links[i].target = "_top";
		links[i].removeAttribute("src");
	}
});
if(hljs)
{
	hljs.addPlugin({
		'before:highlight': function(info) {
			info.code = info.code.trim().replaceAll("\t", "    ");
		}
	});
}