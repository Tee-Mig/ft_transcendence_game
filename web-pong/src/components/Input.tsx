function Input(props: { id?: string, placeholder?: string, type?: string, value?: string, updateString?: React.ChangeEventHandler<HTMLInputElement> }) {
	return (
		<input
			id={props.id}
			className="input"
			placeholder={props.placeholder}
			onChange={props.updateString}
		></input>
	)
}

export default Input;