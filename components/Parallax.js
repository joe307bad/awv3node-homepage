import React from 'react';
import Animated from 'animated/lib/targets/react-dom';
import throttle from 'lodash/throttle';

export default class extends React.Component {
    layers = [];
    height = 0;
    offset = 0;
    busy = false;

    scroller = () => {
        this.layers.forEach(layer => layer.move(this.height, this.offset))
        this.busy = false;
    }
    scrollerRaf = () => requestAnimationFrame(this.scroller)
    scrollerThrottle = throttle(this.scrollerRaf, 100)

    onScroll = event => {
        if (!this.busy) {
            this.busy = true;
            this.scrollerRaf();
            this.offset = event.target.scrollTop;
        }
    };

    onResize = () => {
        this.offset = this.refs.container.scrollTop;
        this.height = this.refs.container.clientHeight;
        this.layers.forEach(layer => layer.height(this.height));
        this.scroller();
    };

    componentDidUpdate() {
        this.layers = Object.keys(this.refs).filter(key => this.refs[key].move).map(key => this.refs[key]);
        this.onResize();
    }

    componentDidMount() {
        window.addEventListener('resize', this.onResize, false);
        this.componentDidUpdate();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.onResize, false);
    }

    render() {
        this.layers = React.Children.map(this.props.children, (child, index) =>
            React.cloneElement(child, { ...child.props, ref: `child-${index}`, container: this }));

        return (
            <div
                ref="container"
                onScroll={this.onScroll}
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    overflowX: 'hidden',
                    overflowY: 'auto',
                    transform: 'translate3d(0, 0, 0)',
                    ...this.props.style
                }}
                className={this.props.className}>
                <div
                    ref="content"
                    style={{
                        position: 'absolute',
                        width: '100%',
                        transform: 'translate3d(0, 0, 0)',
                        overflow: 'hidden',
                        height: this.props.height,
                        ...this.props.innerStyle
                    }}>
                    {this.layers}
                </div>
            </div>
        );
    }

    static Layer = class extends React.Component {
        constructor(props) {
            super(props);
            const offset = -(props.container.offset * props.speed) + props.container.height * props.offset;
            this.animation = new Animated.Value(offset);
            this.invisible = false;
        }

        static propTypes = { factor: React.PropTypes.number, offset: React.PropTypes.number };
        static defaultProps = { factor: 1, offset: 0 };

        move(height, offset) {
            let calculatedOffset = -(offset * this.props.speed) + height * this.props.offset;
            Animated.spring(this.animation, { toValue: parseFloat(calculatedOffset) }).start();
        }

        height(height) {
            let calculatedHeight = height * this.props.factor;
            this.refs.layer.refs.node.style.height = calculatedHeight.toFixed(2) + 'px';
        }

        render() {
            return (
                <Animated.div
                    ref="layer"
                    style={{
                        position: 'absolute',
                        backgroundSize: 'auto',
                        backgroundRepeat: 'no-repeat',
                        willChange: 'transform',
                        width: '100%',
                        height: this.props.container.height * this.props.factor,
                        transform: [
                            {
                                translate3d: this.animation.interpolate({
                                    inputRange: [0, 100000],
                                    outputRange: ['0,0px,0', '0,100000px,0']
                                })
                            }
                        ],
                        ...this.props.style
                    }}
                    className={this.props.className}>
                    {this.props.children}
                </Animated.div>
            );
        }
    };
}
