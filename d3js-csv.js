class D3jsCharts {
  constructor(selector, width = 1000, height = 600, margins = { top: 20, right: 30, bottom: 80, left: 50 }) {
    this.selector = selector;
    this.width = width;
    this.height = height;
    this.margins = margins;
    this.data = null;

    this.createSvg();
  }

  createSvg() {
    this.svg = d3.select(this.selector)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .append("g")
      .attr("transform", `translate(${this.margins.left}, ${this.margins.top})`);
  }

  async loadCSV(filePath) {
    this.data = await d3.csv(filePath, d => ({
      category: d["Sub-Category"],
      sales: +d.Sales,
      profit: +d.Profit,
      region: d.Region,
      quantity: +d.Quantity,
    }));
  }

  renderBarChart() {
    const groupedData = d3.rollup(
      this.data,
      v => d3.sum(v, d => d.sales),
      d => d.category
    );

    const data = Array.from(groupedData, ([category, value]) => ({ category, value }));

    const x = d3.scaleBand()
      .domain(data.map(d => d.category))
      .range([0, this.width - this.margins.left - this.margins.right])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)])
      .range([this.height - this.margins.top - this.margins.bottom, 0]);

    this.svg.append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => x(d.category))
      .attr("y", d => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", d => y(0) - y(d.value))
      .attr("fill", "steelblue");

    this.svg.append("g")
      .attr("transform", `translate(0, ${this.height - this.margins.top - this.margins.bottom})`)
      .call(d3.axisBottom(x));

    this.svg.append("g")
      .call(d3.axisLeft(y));

    // Rótulos dos eixos
    this.svg.append("text")
      .attr("x", (this.width - this.margins.left - this.margins.right) / 2)
      .attr("y", this.height - this.margins.bottom + 30)
      .attr("text-anchor", "middle")
      .text("Sub-Category");

    this.svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(this.height - this.margins.top - this.margins.bottom) / 2)
      .attr("y", -this.margins.left + 10)
      .attr("text-anchor", "middle")
      .text("Sales");
  }

  renderScatterPlot() {
    const x = d3.scaleLinear()
      .domain(d3.extent(this.data, d => d.sales))
      .range([0, this.width - this.margins.left - this.margins.right]);

    const y = d3.scaleLinear()
      .domain(d3.extent(this.data, d => d.profit))
      .range([this.height - this.margins.top - this.margins.bottom, 0]);

    this.svg.selectAll("circle")
      .data(this.data)
      .join("circle")
      .attr("cx", d => x(d.sales))
      .attr("cy", d => y(d.profit))
      .attr("r", 5)
      .attr("fill", "orange");

    this.svg.append("g")
      .attr("transform", `translate(0, ${this.height - this.margins.top - this.margins.bottom})`)
      .call(d3.axisBottom(x));

    this.svg.append("g")
      .call(d3.axisLeft(y));

    // Rótulos dos eixos
    this.svg.append("text")
      .attr("x", (this.width - this.margins.left - this.margins.right) / 2)
      .attr("y", this.height - this.margins.bottom + 30)
      .attr("text-anchor", "middle")
      .text("Sales");

    this.svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(this.height - this.margins.top - this.margins.bottom) / 2)
      .attr("y", -this.margins.left + 10)
      .attr("text-anchor", "middle")
      .text("Profit");
  }

  renderHeatmap() {
    const groupedData = d3.rollup(
      this.data,
      v => d3.sum(v, d => d.sales),
      d => d.region,
      d => d.category
    );

    const regions = Array.from(groupedData.keys());
    const categories = Array.from(new Set(this.data.map(d => d.category)));

    const x = d3.scaleBand()
      .domain(regions)
      .range([0, this.width - this.margins.left - this.margins.right])
      .padding(0.1);

    const y = d3.scaleBand()
      .domain(categories)
      .range([this.height - this.margins.top - this.margins.bottom, 0])
      .padding(0.1);

    const color = d3.scaleSequential()
      .domain([0, d3.max(this.data, d => d.sales)])
      .interpolator(d3.interpolateBlues);

    const data = Array.from(groupedData, ([region, categoryMap]) =>
      Array.from(categoryMap, ([category, value]) => ({ region, category, value }))
    ).flat();

    this.svg.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => x(d.region))
      .attr("y", d => y(d.category))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", d => color(d.value));

    this.svg.append("g")
      .attr("transform", `translate(0, ${this.height - this.margins.top - this.margins.bottom})`)
      .call(d3.axisBottom(x));

    this.svg.append("g")
      .call(d3.axisLeft(y));

    // Rótulos dos eixos
    this.svg.append("text")
      .attr("x", (this.width - this.margins.left - this.margins.right) / 2)
      .attr("y", this.height - this.margins.bottom + 30)
      .attr("text-anchor", "middle")
      .text("Region");

    this.svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(this.height - this.margins.top - this.margins.bottom) / 2)
      .attr("y", -this.margins.left + 10)
      .attr("text-anchor", "middle")
      .text("Category");
  }
}

async function main() {
  const filePath = "superstore.csv";

  const barChart = new D3jsCharts("#barChart");
  await barChart.loadCSV(filePath);
  barChart.renderBarChart();

  const scatterPlot = new D3jsCharts("#scatterPlot");
  await scatterPlot.loadCSV(filePath);
  scatterPlot.renderScatterPlot();

  const heatmap = new D3jsCharts("#heatmap");
  await heatmap.loadCSV(filePath);
  heatmap.renderHeatmap();
}

main();
