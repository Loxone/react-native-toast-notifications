import React, { Component } from "react";
import {
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  View,
  Pressable
} from "react-native";
import Toast, { ToastOptions, ToastProps } from "./toast";

const { width } = Dimensions.get("window");

export interface Props extends ToastOptions {
  renderToast?(toast: ToastProps): JSX.Element;
  renderType?: { [type: string]: (toast: ToastProps) => JSX.Element };
  offset?: number;
  offsetTop?: number;
  offsetBottom?: number;
  swipeEnabled?: boolean;
  foldIcon?: JSX.Element;
  clearIcon?: JSX.Element;
}

interface State {
  toasts: Array<ToastProps>;
  toastsHistory: Array<ToastProps>;
  unfolded: boolean;
}

class ToastContainer extends Component<Props, State> {
  constructor(props: Props) {
	super(props);
	this.state = {
	  toasts: [],
	  toastsHistory: [],
	  unfolded: false,
	};
  }

  static defaultProps: Props = {
	placement: "bottom",
	offset: 10,
	swipeEnabled: true,
  };
  /**
   * Shows a new toast. Returns id
   */
  show = (message: string | JSX.Element, toastOptions?: ToastOptions) => {
	let id = toastOptions?.id || Math.random().toString();
	const onDestroy = () => {
	  toastOptions?.onClose && toastOptions?.onClose();
	  this.setState({ toasts: this.state.toasts.filter((t) => t.id !== id), toastsHistory: this.state.toastsHistory.filter((t) => t.id !== id) });
	};

	requestAnimationFrame(() => {
		this.setState({
		toasts: [
			{
			id,
			onDestroy,
			message,
			open: true,
			onPress: () => this.renderUnfolded(),
			onHide: () => this.hide(id),
			...this.props,
			...toastOptions,
			},
			...this.state.toasts.filter((t) => t.open),
		],
		});
		if(this.state.toasts.length == 2) {
			this.setState({
				toastsHistory: [
					{...this.state.toasts[1]},
					...this.state.toastsHistory
				],
				toasts: [this.state.toasts[0]]
			})
		}
		console.log(`Toasts: ${JSON.stringify(this.state.toasts)}`);
		console.log(`Toasts History: ${JSON.stringify(this.state.toastsHistory)}`);
		console.log(`Unfolded: ${this.state.unfolded})}`);
	});

	// if(this.state.toasts.some((t) => t.open === true)) {
	// 	this.setState({
	// 		toastsHistory: this.state.toasts.filter((t) => t.open === true),
	// 		toasts: this.state.toasts.filter((t, index) => t.open !== true)
	// 	})
	// }
	return id;
  };
  renderUnfolded = () => {
	this.setState({
		unfolded: !this.state.unfolded
	})
  }
  /**
   * Updates a toast, To use this create you must pass an id to show method first, then pass it here to update the toast.
   */
  update = (
	id: string,
	message: string | JSX.Element,
	toastOptions?: ToastOptions
  ) => {
	this.setState({
	  toasts: this.state.toasts.map((toast) =>
		toast.id === id ? { ...toast, message, ...toastOptions } : toast
	  ),
	});
  };

  /**
   * Removes a toast from stack
   */
  hide = (id: string) => {
	this.setState({
	  toasts: this.state.toasts.map((t) =>
		t.id === id ? { ...t, open: false } : t
	  ),
	  toastsHistory: this.state.toastsHistory.map((t) =>
	  t.id === id ? { ...t, open: false } : t
	)
	});
  };

  /**
   * Removes all toasts in stack
   */
  hideAll = () => {
	this.setState({
	  toasts: [],
	  toastsHistory: [],
	  unfolded: this.state.unfolded ? !this.state.unfolded : this.state.unfolded
	});
  };

  /**
   * Check if a toast is currently open
   */
  isOpen = (id: string) => {
	return this.state.toasts.some((t) => t.id === id && t.open);
  }

  renderBottomToasts() {
    const { toasts, toastsHistory } = this.state;
    let { offset, offsetBottom } = this.props;
    let style: ViewStyle = {
      bottom: offsetBottom || offset,
      width: width,
      justifyContent: "flex-end",
      flexDirection: "column",
    };

	if(toastsHistory.length > 0 && toasts.length > 0) {
		return (
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "position" : undefined}
				pointerEvents="box-none"
				style={[styles.container, style]}
			>
				<Toast key={toasts[0].id} {...toasts[0]} type='multiple' />
			</KeyboardAvoidingView>
		)
	}	
	else if (toasts.length > 0) return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "position" : undefined}
        style={[styles.container, style]}
        pointerEvents="box-none"
      >
        <Toast key={toasts[0].id} {...toasts[0]} />
      </KeyboardAvoidingView>
    );
	else return null;
  }

  unfoldedView = () => {
	let totalToasts: boolean = (this.state.toasts.length + this.state.toastsHistory.length) > 0;
	{return totalToasts ? <KeyboardAvoidingView style={unfoldedStyling.container}>
			<View style={unfoldedStyling.restrict}>
				<View style={unfoldedStyling.buttons}>
					<Pressable onPress={() => this.renderUnfolded()} style={[unfoldedStyling.icons, unfoldedStyling.foldIcon]}>{this.props.foldIcon}</Pressable>
					<Pressable onPress={() => this.hideAll()} style={unfoldedStyling.icons}>{this.props.clearIcon}</Pressable>
				</View>
				{this.state.toasts.length > 0 && <Toast key={this.state.toasts[0].id} {...this.state.toasts[0]} />}
				{this.state.toastsHistory.length > 0 && this.state.toastsHistory.map((t) => <Toast key={t.id} {...t} />)}
			</View>
		</KeyboardAvoidingView> : null}
  }

  render() {
	return (
	  <>
		{this.state.unfolded ? this.unfoldedView() : this.renderBottomToasts()}
	  </>
	);
  }
}

const styles = StyleSheet.create({
  container: {
	flex: 0,
	position: "absolute",
	zIndex: 999999,
	elevation: 999999,
	flexDirection: 'column',
	padding: 10,
	...(Platform.OS === "web" ? { overflow: "hidden" } : null),
  },
  message: {
	color: "white",
  },
  fake: {
	position: 'absolute',
	width: '90%',
	height: 5,
	borderBottomEndRadius: 10
  }
});

const unfoldedStyling = StyleSheet.create({
	container: {
		position: 'absolute',
		flexDirection: 'column',
		minHeight: '30%',
		width: '100%',
		justifyContent: 'flex-start',
		alignItems: 'center',
		bottom: 40
	},
	restrict: {
		maxWidth: '50%'
	},
	buttons: {
		flexDirection: 'row',
		alignSelf: 'flex-end',
		marginBottom: 10
	},
	icons: {
		padding: 10,
        backgroundColor: '#1C1C1E8F',
		borderRadius: 4, 
        backdropFilter: {blur: 28},
	},
	foldIcon: {
		marginEnd: 10
	}
});

export default ToastContainer;