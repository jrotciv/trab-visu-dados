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
      gender: d.gender,
      race: d["race/ethnicity"],
      education: d["parental level of education"],
      lunch: d.lunch,
      preparation: d["test preparation course"],
      math: +d["math score"],
      reading: +d["reading score"],
      writing: +d["writing score"]
    }));
  }

  renderBarChart() {
    const groupedData = d3.rollup(
      this.data,
      v => d3.mean(v, d => d.math),
      d => d.gender
    );

    const data = Array.from(groupedData, ([gender, value]) => ({ gender, value }));

    const x = d3.scaleBand()
      .domain(data.map(d => d.gender))
      .range([0, this.width - this.margins.left - this.margins.right])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)])
      .range([this.height - this.margins.top - this.margins.bottom, 0]);

    this.svg.append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => x(d.gender))
      .attr("y", d => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", d => y(0) - y(d.value))
      .attr("fill", "steelblue");

    this.svg.append("g")
      .attr("transform", `translate(0, ${this.height - this.margins.top - this.margins.bottom})`)
      .call(d3.axisBottom(x));

    this.svg.append("g")
      .call(d3.axisLeft(y));

    this.svg.append("text")
      .attr("x", (this.width - this.margins.left - this.margins.right) / 2)
      .attr("y", this.height - this.margins.bottom + 30)
      .attr("text-anchor", "middle")
      .text("Gender");

    this.svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(this.height - this.margins.top - this.margins.bottom) / 2)
      .attr("y", -this.margins.left + 10)
      .attr("text-anchor", "middle")
      .text("Average Math Score");
  }

  renderScatterPlot() {
    const x = d3.scaleLinear()
      .domain(d3.extent(this.data, d => d.math))
      .range([0, this.width - this.margins.left - this.margins.right]);

    const y = d3.scaleLinear()
      .domain(d3.extent(this.data, d => d.reading))
      .range([this.height - this.margins.top - this.margins.bottom, 0]);

    this.svg.selectAll("circle")
      .data(this.data)
      .join("circle")
      .attr("cx", d => x(d.math))
      .attr("cy", d => y(d.reading))
      .attr("r", 5)
      .attr("fill", "orange");

    this.svg.append("g")
      .attr("transform", `translate(0, ${this.height - this.margins.top - this.margins.bottom})`)
      .call(d3.axisBottom(x));

    this.svg.append("g")
      .call(d3.axisLeft(y));

    this.svg.append("text")
      .attr("x", (this.width - this.margins.left - this.margins.right) / 2)
      .attr("y", this.height - this.margins.bottom + 30)
      .attr("text-anchor", "middle")
      .text("Math Score");

    this.svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(this.height - this.margins.top - this.margins.bottom) / 2)
      .attr("y", -this.margins.left + 10)
      .attr("text-anchor", "middle")
      .text("Reading Score");
  }

  renderHeatmap() {
    const groupedData = d3.rollup(
      this.data,
      v => d3.mean(v, d => d.writing),
      d => d.gender,
      d => d.race
    );

    const genders = Array.from(groupedData.keys());
    const races = Array.from(new Set(this.data.map(d => d.race)));

    const x = d3.scaleBand()
      .domain(genders)
      .range([0, this.width - this.margins.left - this.margins.right])
      .padding(0.1);

    const y = d3.scaleBand()
      .domain(races)
      .range([this.height - this.margins.top - this.margins.bottom, 0])
      .padding(0.1);

    const color = d3.scaleSequential()
      .domain([0, d3.max(this.data, d => d.writing)])
      .interpolator(d3.interpolateBlues);

    const data = Array.from(groupedData, ([gender, raceMap]) =>
      Array.from(raceMap, ([race, value]) => ({ gender, race, value }))
    ).flat();

    this.svg.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => x(d.gender))
      .attr("y", d => y(d.race))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", d => color(d.value));

    this.svg.append("g")
      .attr("transform", `translate(0, ${this.height - this.margins.top - this.margins.bottom})`)
      .call(d3.axisBottom(x));

    this.svg.append("g")
      .call(d3.axisLeft(y));

    this.svg.append("text")
      .attr("x", (this.width - this.margins.left - this.margins.right) / 2)
      .attr("y", this.height - this.margins.bottom + 30)
      .attr("text-anchor", "middle")
      .text("Gender");

    this.svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(this.height - this.margins.top - this.margins.bottom) / 2)
      .attr("y", -this.margins.left + 10)
      .attr("text-anchor", "middle")
      .text("Race/Ethnicity");
  }
}

async function main() {
  const filePath = "StudentsPerformance.csv";

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
