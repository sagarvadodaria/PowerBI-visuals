
module powerbitests.customVisuals {
    import VisualClass = powerbi.visuals.samples.DropdownSlicer;

    describe("DropdownSlicer", () => {
        describe('capabilities', () => {
            it("registered capabilities", () => expect(VisualClass.capabilities).toBeDefined());
        });

        describe("DOM tests", () => {
            let visualBuilder: DropdownSlicerBuilder;
            let dataViews: powerbi.DataView[];

            beforeEach(() => {
                visualBuilder = new DropdownSlicerBuilder();
                dataViews = [new powerbitests.customVisuals.sampleDataViews.CarLogosData().getDataView()];
            });

            it("main element created", () => expect(visualBuilder.mainElement[0]).toBeInDOM());
            it("update", (done) => {
                visualBuilder.update(dataViews);
                setTimeout(() => {
                    expect(visualBuilder.visibleGroup[0]).toBeInDOM();
                    expect(visualBuilder.visibleGroup.children("option.row").length)
                        .toBe(dataViews[0].categorical.categories[0].values.length);
                    done();
                }, 1000);
            });
        });
    });

    class DropdownSlicerBuilder extends VisualBuilderBase<VisualClass> {
        constructor(height: number = 200, width: number = 300, isMinervaVisualPlugin: boolean = false) {
            super(height, width, isMinervaVisualPlugin);
            this.build();
            this.init();
        }

        public get mainElement() {
            return this.element.children("div.dropdownSlicer");
        }

        public get visibleGroup() {
            return this.mainElement
                .children("div.slicerBody")
                .children("div.scrollRegion")
                .children("div.visibleGroup")
                .children("select.select");
        }

        private build(): void {
            this.visual = new VisualClass();
        }
    }
}