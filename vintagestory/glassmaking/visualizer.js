window.addEventListener("DOMContentLoaded", function() {
	var root = document.querySelector(".recipe-visualizer");
	var code = root.querySelector(".recipe-code");
	var svg = root.querySelector(".recipe-visual svg");
	var step = root.querySelector(".recipe-visual input");
	var label = root.querySelector(".recipe-visual label");
	var svgInner1 = svg.querySelector(".inner1");
	var svgOuter1 = svg.querySelector(".outer1");
	var svgInner2 = svg.querySelector(".inner2");
	var svgOuter2 = svg.querySelector(".outer2");

	var defaultShape = { segments: 1, outer: [{ segments: 1, vertices: [[-1.5, 0]] }], inner: [{ segments: 1, vertices: [[-1.5, 0]] }] };

	function ensureBounds(x, y, bounds) {
		if(x < bounds.minX) bounds.minX = x;
		else if(x > bounds.maxX) bounds.maxX = x;
		if(y < bounds.minY) bounds.minY = y;
		else if(y > bounds.maxY) bounds.maxY = y;
	}

	function calcBezierBounds(bezier, bounds) {
		if(typeof bezier == "object" && Array.isArray(bezier))
		{
			for(var i = 0; i < bezier.length; i++)
			{
				var coords = bezier[i];
				if(typeof coords == "object" && Array.isArray(coords) && coords.length == 2)
				{
					if(typeof coords[0] == "number" && typeof coords[1] == "number")
					{
						ensureBounds(coords[0], coords[1], bounds);
						ensureBounds(coords[0], -coords[1], bounds);
					}
					else return false;
				}
				else return false;
			}
			return true;
		}
		return false;
	}
	function calcShapeBounds(parts, bounds) {
		if(parts.length > 0)
		{
			var first = parts[0];
			if(typeof first == "object")
			{
				if(Array.isArray(first))
				{
					if(first.length == 2)
					{
						return calcBezierBounds(parts, bounds);
					}
					else return false;
				}
				else
				{
					for(var i = 0; i < parts.length; i++)
					{
						if(typeof parts[i] != "object") return false;
						if(typeof parts[i].segments != "number") return false;
						if(!calcBezierBounds(parts[i].vertices, bounds))
						{
							return false;
						}
					}
					return true;
				}
			}
			else return false;
		}
		return true;
	}

	function drawShape(inner, outer) {
		if(inner == null)
		{
			svgInner1.setAttribute("points", "");
			svgInner2.setAttribute("points", "");
		}
		else
		{
			var negPoints = [];
			for(var i = 0; i < inner.length; i++)
			{
				negPoints.push([inner[i][0], -inner[i][1]].join(","));
				inner[i] = inner[i].join(",");
			}
			svgInner1.setAttribute("points", inner.join(" "));
			svgInner2.setAttribute("points", negPoints.join(" "));
		}
		var negPoints = [];
		for(var i = 0; i < outer.length; i++)
		{
			negPoints.push([outer[i][0], -outer[i][1]].join(","));
			outer[i] = outer[i].join(",");
		}
		svgOuter1.setAttribute("points", outer.join(" "));
		svgOuter2.setAttribute("points", negPoints.join(" "));
	}

	function lerp2(a, b, t) {
		return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
	}

	function interpolateBezier(points, t) {
		if(points.length == 0) return [0, 0];
		if(points.length == 1) return points[0];
		points = points.slice();
		var count = points.length - 1;
		while(count > 0)
		{
			for(var i = 0; i < count; i++)
			{
				points[i] = lerp2(points[i], points[i + 1], t);
			}
			count--;
		}
		return points[0];
	}

	function interpolateParts(parts, full, t) {
		if(parts == null || parts.length == 0) return [0, 0];
		if(parts.length == 1)
		{
			return interpolateBezier(parts[0].vertices, t / full);
		}
		for(var i = 0; i < parts.length; i++)
		{
			if(t <= parts[i].segments)
			{
				return interpolateBezier(parts[i].vertices, t / parts[i].segments);
			}
			else
			{
				t -= parts[i].segments;
			}
		}
		return interpolateBezier(parts[parts.length - 1].vertices, 1);
	}

	var shapeSteps = null;
	function updateShape(t) {
		var index = Math.min(Math.floor(t), shapeSteps.length - 1);
		var prevIndex = index - 1;
		var newShape = null;
		var prevShape = defaultShape;
		t = t - index;
		label.innerHTML = "Step " + (index + 1) + ": " + Math.round(t * 100) + "%";
		for(var i = prevIndex; i >= 0; i--)
		{
			if(shapeSteps[i] != null)
			{
				prevShape = shapeSteps[i];
				break;
			}
		}
		if(shapeSteps[index] != null)
		{
			newShape = shapeSteps[index];
		}
		var outer = [];
		var inner = null;
		if(newShape == null)
		{
			var segments = prevShape.segments;
			for(var i = 0; i <= segments; i++)
			{
				outer.push(interpolateParts(prevShape.outer, segments, i));
			}
			if(prevShape.inner != null)
			{
				inner = [];
				for(var i = 0; i <= segments; i++)
				{
					inner.push(interpolateParts(prevShape.inner, segments, i));
				}
			}
		}
		else
		{
			var ls = prevShape.segments + (newShape.segments - prevShape.segments) * t;
			var segments = Math.ceil(ls);
			var step = 1 / segments;
			for(var i = 0; i <= segments; i++)
			{
				outer.push(lerp2(interpolateParts(prevShape.outer, prevShape.segments, step * i * prevShape.segments), interpolateParts(newShape.outer, newShape.segments, step * i * newShape.segments), t));
			}
			if(prevShape.inner != null || newShape.inner != null)
			{
				var ps = prevShape.inner == null ? defaultShape : prevShape;
				var ns = newShape.inner == null ? defaultShape : newShape;
				inner = [];
				for(var i = 0; i <= segments; i++)
				{
					inner.push(lerp2(interpolateParts(ps.inner, ps.segments, step * i * ps.segments), interpolateParts(ns.inner, ns.segments, step * i * ns.segments), t));
				}
			}
		}
		drawShape(inner, outer);
	}

	code.addEventListener("change", function() {
		var json = JSON.parse(code.value);
		if(typeof json == "object" && typeof json.steps == "object" && Array.isArray(json.steps))
		{
			var steps = json.steps;
			var bounds = { minX: -3, minY: 0, maxX: 0, maxY: 0 };
			for(var i = 0; i < steps.length; i++)
			{
				if(typeof steps[i] == "object" && typeof steps[i].shape == "object")
				{
					var shape = steps[i].shape;
					if(typeof shape.segments == "number")
					{
						if(typeof shape.outer == "object" && Array.isArray(shape.outer))
						{
							if(!calcShapeBounds(shape.outer, bounds)) return false;
							if(typeof shape.inner == "object" && Array.isArray(shape.inner))
							{
								if(!calcShapeBounds(shape.inner, bounds)) return false;
							}
						}
						else return false;
					}
					else return false;
				}
			}
			svg.setAttribute("viewBox", [bounds.minX - 5, bounds.minY - 5, (bounds.maxX - bounds.minX) + 10, (bounds.maxY - bounds.minY) + 10].join(" "));
			shapeSteps = null;
			step.max = steps.length;
			step.value = 0;
			shapeSteps = [];
			for(var i = 0; i < steps.length; i++)
			{
				var shape = steps[i].shape;
				if(shape != null)
				{
					if(shape.outer.length > 0)
					{
						if(typeof shape.outer[0][0] == "number")
						{
							shape.outer = [{ segments: shape.segments, vertices: shape.outer }];
						}
					}
					if(shape.inner != null && shape.inner.length > 0)
					{
						if(typeof shape.inner[0][0] == "number")
						{
							shape.inner = [{ segments: shape.segments, vertices: shape.inner }];
						}
					}
				}
				shapeSteps[i] = shape;
			}
			updateShape(0);
		}
	});
	step.addEventListener("input", function() {
		if(shapeSteps != null)
		{
			updateShape(+step.value);
		}
	});
});