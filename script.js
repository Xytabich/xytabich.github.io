window.addEventListener("DOMContentLoaded", function() {
	var links = document.body.querySelectorAll("a[src]");
	for(var i = 0; i < links.length; i++)
	{
		links[i].href = "?p=" + encodeURIComponent(links[i].getAttribute("src"));
		links[i].removeAttribute("src");
	}
});