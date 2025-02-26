import React, { Component } from 'react';
import {
    StyleSheet,
    ViewStyle,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    SafeAreaView,
    Pressable,
    Text,
    ScrollView,
    View,
    ScaledSize,
} from 'react-native';
import Toast, { ToastOptions, ToastProps } from './toast';


export interface Props extends ToastOptions {
    renderToast?(toast: ToastProps): JSX.Element;
    renderType?: { [type: string]: (toast: ToastProps) => JSX.Element };
    offset?: number;
    currentSNR: string;
    offsetTop?: number;
    offsetBottom?: number;
    swipeEnabled?: boolean;
}

interface State {
    toasts: Array<ToastProps>;
    isUnfolded: boolean;
    isVisible: boolean;
    currentSNR: string;
    windowDimensions: ScaledSize
}

class ToastContainer extends Component<Props, State> {

    _boundOnDimensionChange: (dim: {window: ScaledSize, screen: ScaledSize}) => void;
    constructor(props: Props) {
        super(props);
        this._boundOnDimensionChange = this.onDimensionChange.bind(this)
        this.state = {
            toasts: [],
            isUnfolded: false,
            isVisible: true,
            currentSNR: '',
            windowDimensions: Dimensions.get('window')
        };
    }

    static defaultProps: Props = {
        placement: 'bottom',
        offsetBottom: 10,
        swipeEnabled: true,
        currentSNR: '',
        dismissIcon: (
            <Text
                style={{
                    color: 'white',
                    backgroundColor: 'black',
                    padding: 10,
                    borderRadius: 5,
                }}
            >
                Please provide an Icon to ToastProvider's dismissIcon prop
            </Text>
        ),
        foldIcon: (
            <Text
                style={{
                    color: 'white',
                    backgroundColor: 'black',
                    padding: 10,
                    borderRadius: 5,
                }}
            >
                Please provide an Icon to ToastProvider's foldIcon prop
            </Text>
        ),
        type: 'normal',
    };

    componentDidMount() {
        Dimensions.addEventListener('change', this._boundOnDimensionChange);
    }

    componentWillUnmount() {
        Dimensions.removeEventListener('change', this._boundOnDimensionChange);
    }

    onDimensionChange(dim: {window: ScaledSize, screen: ScaledSize}) {
        this.setState({ windowDimensions: dim.window });
    }

    componentDidUpdate(): void {
        if (this.state.toasts.length <= 1 && this.state.isUnfolded) {
            this.setState({
                isUnfolded: false,
            });
        }
        if (this.props.currentSNR !== this.state.currentSNR) {
            this.setState({
                currentSNR: this.props.currentSNR,
                toasts: this.state.toasts.map((t) => {
                    return {
                        ...t,
                        currentSNR: this.props.currentSNR,
                    };
                }),
            });
        }
    }

    /**
     * Shows a new toast. Returns id
     */
    show = (message: string | JSX.Element, toastOptions?: ToastOptions) => {
        const id = toastOptions?.id || Math.random().toString();
        const onDestroy = () => {
            toastOptions?.onClose && toastOptions?.onClose();
            this.setState({
                toasts: this.state.toasts.filter((t) => t.id !== id),
            });
        };

        requestAnimationFrame(() => {
            this.setState({
                toasts: [
                    {
                        id,
                        onDestroy,
                        message,
                        open: true,
                        onHide: () => this.hide(id),
                        ...this.props,
                        currentSNR: this.props.currentSNR,
                        ...toastOptions,
                    },
                    ...this.state.toasts.filter((t) => t.open),
                ],
            });
        });

        return id;
    };

    /**
     * Updates a toast, To use this create you must pass an id to show method first, then pass it here to update the toast.
     */
    update = (
        id: string,
        message: string | JSX.Element,
        toastOptions?: ToastOptions,
    ) => {
        this.setState({
            toasts: this.state.toasts.map((toast) =>
                toast.id === id
                    ? { ...toast, message, ...toastOptions }
                    : toast,
            ),
        });
    };

    /**
     * Removes a toast from stack
     */
    hide = (id: string) => {
        this.setState({
            toasts: this.state.toasts.map((t) =>
                t.id === id ? { ...t, open: false } : t,
            ),
        });
    };

    /**
     * Removes all toasts in stack
     */
    hideAll = (finished?: () => void) => {
        this.setState({
            toasts: this.state.toasts.map((t) => ({ ...t, open: false })),
        });
        finished?.();
    };

    /**
     * Check if a toast is currently open
     */
    isOpen = (id: string) => {
        return this.state.toasts.some((t) => t.id === id && t.open);
    };

    toggleToastVisibility = (isVisible: boolean = !this.state.isVisible) => {
        this.setState({
            isVisible,
        });
    };

    renderBottomToast() {
        const { toasts } = this.state;
        let { offset, offsetBottom } = this.props;
        let style: ViewStyle = {
            bottom: offsetBottom || offset,
            width: this.state.windowDimensions.width,
            justifyContent: 'flex-end',
            flexDirection: 'column',
            paddingHorizontal: 4,
        };
        const bottomToasts = toasts.filter((t) => t.placement === 'bottom');
        return (
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                style={[styles.container, style]}
                pointerEvents="box-none"
            >
                <SafeAreaView>
                    {bottomToasts.length > 1 ? (
                        <Toast
                            key={bottomToasts[0].id}
                            {...bottomToasts[0]}
                            type="multiple"
                            swipeEnabled={false}
                            onPress={() => {
                                this.setState({
                                    isUnfolded: !this.state.isUnfolded,
                                });
                            }}
                        />
                    ) : (
                        bottomToasts.length > 0 && (
                            <Toast
                                key={bottomToasts[0].id}
                                {...bottomToasts[0]}
                            />
                        )
                    )}
                </SafeAreaView>
            </KeyboardAvoidingView>
        );
    }

    renderTopToast() {
        const { toasts } = this.state;
        let { offset, offsetTop } = this.props;
        let style: ViewStyle = {
            top: offsetTop || offset,
            width: this.state.windowDimensions.width,
            justifyContent: 'flex-start',
            flexDirection: 'column-reverse',
        };
        return (
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                style={[styles.container, style]}
                pointerEvents="box-none"
            >
                <SafeAreaView>
                    {toasts
                        .filter((t) => t.placement === 'top')
                        .map((toast) => (
                            <Toast key={toast.id} {...toast} />
                        ))}
                </SafeAreaView>
            </KeyboardAvoidingView>
        );
    }

    renderUnfolded() {
        const { toasts } = this.state;
        const { offsetBottom } = this.props;
        const style: ViewStyle = {
            bottom: offsetBottom,
            width: this.state.windowDimensions.width,
            justifyContent: 'flex-end',
            flexDirection: 'column',
        };
        const buttonStyle: ViewStyle = {
            padding: 10,
            backgroundColor: '#1C1C1E',
        };
        return (
            <>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'position' : undefined}
                    style={[styles.container, style]}
                    pointerEvents="box-none"
                >
                    <SafeAreaView
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            width: (toasts[0].style as ViewStyle)?.width ?? 358,
                            justifyContent: 'flex-end',
                            alignSelf: 'center',
                            marginBottom: 8,
                        }}
                    >
                        <Pressable
                            onPress={() => {
                                this.setState({
                                    isUnfolded: !this.state.isUnfolded,
                                });
                            }}
                            style={[buttonStyle, { marginRight: 4 }]}
                        >
                            {this.props.foldIcon}
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                this.hideAll(() =>
                                    this.setState({
                                        isUnfolded: false,
                                    }),
                                );
                            }}
                            style={buttonStyle}
                        >
                            {this.props.dismissIcon}
                        </Pressable>
                    </SafeAreaView>
                    <View style={{ flex: 1, maxHeight: this.state.windowDimensions.height / 2 }}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            nestedScrollEnabled={false}
                        >
                            {toasts
                                .filter((toast) => toast.type === 'normal')
                                .map((toast, index) => {
                                    return (
                                        <Toast
                                            key={toast.id}
                                            {...toast}
                                            style={{
                                                ...(toast.style as object),
                                                marginBottom:
                                                    index < toasts.length - 1
                                                        ? 4
                                                        : 0,
                                            }}
                                        />
                                    );
                                })}
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
                <Pressable
                    style={{
                        height: this.state.windowDimensions.height,
                        width: this.state.windowDimensions.width,
                        position: 'absolute',
                        backgroundColor: '#000000CC',
                    }}
                    onPress={() => {
                        this.setState({
                            isUnfolded: !this.state.isUnfolded,
                        });
                    }}
                />
            </>
        );
    }

    render() {
        return (
            this.state.isVisible && (
                <>
                    {this.renderTopToast()}
                    {this.state.isUnfolded
                        ? this.renderUnfolded()
                        : this.renderBottomToast()}
                </>
            )
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 0,
        // @ts-ignore: fixed is available on web.
        position: Platform.OS === 'web' ? 'fixed' : 'absolute',
        maxWidth: '100%',
        zIndex: 999999,
        elevation: 999999,
        alignSelf: 'center',
        ...(Platform.OS === 'web'
            ? { overflow: 'hidden', userSelect: 'none' }
            : null),
    },
    message: {
        color: '#333',
    },
});

export default ToastContainer;
