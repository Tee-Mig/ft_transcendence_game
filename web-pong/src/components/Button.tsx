import { MouseEventHandler } from "react";

function Button(props: { id?: string, text?: string, click?: MouseEventHandler<HTMLButtonElement>, className?: string }) {
	return (
		<button
			id={props.id}
			className={props.className}
			onClick={props.click}
		>{props.text}
		</button>
	)
}

export default Button;